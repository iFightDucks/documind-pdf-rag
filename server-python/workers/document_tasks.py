"""Celery tasks for document processing."""

import asyncio
import logging
import os
from typing import Dict, Any
from celery import current_task
from celery.exceptions import Retry

from workers.celery_app import celery_app
from app.services.document_processor import DocumentProcessor
from app.services.vector_store import VectorStoreService
from app.models import ProcessingStatus

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async functions in Celery tasks."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(coro)


@celery_app.task(bind=True, max_retries=3)
def process_document(
    self,
    document_id: str,
    file_path: str,
    filename: str,
    metadata: Dict[str, Any] = None
):
    """
    Process a document: extract text and store embeddings.
    
    Args:
        document_id: Unique document identifier
        file_path: Path to the uploaded file
        filename: Original filename
        metadata: Additional metadata
    """
    
    async def _process_document():
        """Async implementation of document processing."""
        doc_processor = DocumentProcessor()
        vector_store = VectorStoreService()
        
        try:
            # Initialize services
            await doc_processor.initialize()
            await vector_store.initialize()
            
            # Update task status
            current_task.update_state(
                state="PROGRESS",
                meta={
                    "status": ProcessingStatus.PROCESSING,
                    "progress": 10,
                    "message": "Extracting text from PDF...",
                    "document_id": document_id
                }
            )
            
            # Extract text from PDF
            extracted_text, pdf_metadata = await doc_processor.extract_text_from_pdf(file_path)
            
            # Update progress
            current_task.update_state(
                state="PROGRESS",
                meta={
                    "status": ProcessingStatus.PROCESSING,
                    "progress": 30,
                    "message": "Text extracted successfully. Generating embeddings...",
                    "document_id": document_id,
                    "pages": pdf_metadata.get("page_count", 0)
                }
            )
            
            # Combine metadata
            combined_metadata = {
                **(metadata or {}),
                **pdf_metadata,
                "processing_timestamp": current_task.request.id
            }
            
            # Update progress
            current_task.update_state(
                state="PROGRESS",
                meta={
                    "status": ProcessingStatus.PROCESSING,
                    "progress": 50,
                    "message": "Storing document chunks in vector database...",
                    "document_id": document_id,
                    "pages": pdf_metadata.get("page_count", 0)
                }
            )
            
            # Process and store in vector database
            chunks_count = await vector_store.process_document(
                document_id=document_id,
                text=extracted_text,
                filename=filename,
                metadata=combined_metadata
            )
            
            # Update progress
            current_task.update_state(
                state="PROGRESS",
                meta={
                    "status": ProcessingStatus.PROCESSING,
                    "progress": 90,
                    "message": "Finalizing document processing...",
                    "document_id": document_id,
                    "chunks": chunks_count,
                    "pages": pdf_metadata.get("page_count", 0)
                }
            )
            
            # Final success state
            result = {
                "status": ProcessingStatus.COMPLETED,
                "progress": 100,
                "message": "Document processed successfully",
                "document_id": document_id,
                "chunks": chunks_count,
                "pages": pdf_metadata.get("page_count", 0),
                "text_length": pdf_metadata.get("text_length", 0),
                "metadata": combined_metadata
            }
            
            logger.info(f"Successfully processed document {document_id}: {chunks_count} chunks from {pdf_metadata.get('page_count', 0)} pages")
            return result
            
        except Exception as e:
            logger.error(f"Failed to process document {document_id}: {e}")
            
            # Update task with error state
            error_result = {
                "status": ProcessingStatus.FAILED,
                "progress": 0,
                "message": f"Processing failed: {str(e)}",
                "document_id": document_id,
                "error": str(e)
            }
            
            # Clean up file on error
            try:
                await doc_processor.delete_file(file_path)
            except Exception as cleanup_error:
                logger.error(f"Failed to clean up file {file_path}: {cleanup_error}")
            
            # Retry logic
            if self.request.retries < self.max_retries:
                logger.info(f"Retrying document processing for {document_id} (attempt {self.request.retries + 1})")
                raise self.retry(countdown=60 * (self.request.retries + 1))
            
            return error_result
    
    # Run the async function
    return run_async(_process_document())


@celery_app.task(bind=True)
def cleanup_document(self, document_id: str, file_path: str = None):
    """
    Clean up document data: remove from vector store and delete file.
    
    Args:
        document_id: Document identifier to clean up
        file_path: Optional file path to delete
    """
    
    async def _cleanup_document():
        """Async implementation of document cleanup."""
        try:
            vector_store = VectorStoreService()
            await vector_store.initialize()
            
            # Remove from vector store
            deleted_chunks = await vector_store.delete_document(document_id)
            logger.info(f"Deleted {deleted_chunks} chunks for document {document_id}")
            
            # Delete file if path provided
            if file_path:
                doc_processor = DocumentProcessor()
                await doc_processor.initialize()
                await doc_processor.delete_file(file_path)
            
            return {
                "status": "success",
                "message": f"Cleaned up document {document_id}",
                "deleted_chunks": deleted_chunks,
                "file_deleted": bool(file_path)
            }
            
        except Exception as e:
            logger.error(f"Failed to cleanup document {document_id}: {e}")
            return {
                "status": "error",
                "message": f"Cleanup failed: {str(e)}",
                "error": str(e)
            }
    
    return run_async(_cleanup_document())


@celery_app.task(bind=True)
def health_check_services(self):
    """Check health of all services used in document processing."""
    
    async def _health_check():
        """Async implementation of service health check."""
        try:
            doc_processor = DocumentProcessor()
            vector_store = VectorStoreService()
            
            # Initialize and check services
            await doc_processor.initialize()
            await vector_store.initialize()
            
            doc_health = await doc_processor.health_check()
            vector_health = await vector_store.health_check()
            
            return {
                "status": "healthy",
                "services": {
                    "document_processor": doc_health,
                    "vector_store": vector_health
                },
                "worker_id": self.request.id
            }
            
        except Exception as e:
            logger.error(f"Service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "worker_id": self.request.id
            }
    
    return run_async(_health_check())


@celery_app.task(bind=True)
def get_task_status(self, task_id: str):
    """Get the status of a specific task."""
    try:
        task_result = celery_app.AsyncResult(task_id)
        
        return {
            "task_id": task_id,
            "status": task_result.status,
            "result": task_result.result if task_result.ready() else None,
            "info": task_result.info if hasattr(task_result, 'info') else None
        }
        
    except Exception as e:
        logger.error(f"Failed to get task status for {task_id}: {e}")
        return {
            "task_id": task_id,
            "status": "error",
            "error": str(e)
        } 