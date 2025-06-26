"""Main FastAPI application for DOCUMIND server."""

import logging
import time
import asyncio
import os
import uuid
from contextlib import asynccontextmanager
from typing import List, Optional, Dict
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from pydantic import BaseModel, Field

from .config import settings
from .models import (
    DocumentResponse, DocumentListResponse, ChatRequest, ChatResponse,
    SearchRequest, SearchResponse, ErrorResponse, HealthCheck,
    ProcessingStatus, SourceDocument
)
from .services.document_processor import DocumentProcessor
from .services.vector_store import VectorStoreService
from .services.embeddings import EmbeddingService
from .services.llm import LLMService
from workers.document_tasks import process_document, cleanup_document

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global service instances
doc_processor = DocumentProcessor()
vector_store = VectorStoreService()
embedding_service = EmbeddingService()
llm_service = LLMService()

# Store document metadata in memory (in production, use a database)
documents_db = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown tasks."""
    # Startup
    logger.info("Starting DOCUMIND server...")
    try:
        await doc_processor.initialize()
        await vector_store.initialize()
        await embedding_service.initialize()
        await llm_service.initialize()
        logger.info("All services initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down DOCUMIND server...")

# Create FastAPI app
app = FastAPI(
    title="DOCUMIND API",
    description="PDF RAG (Retrieval-Augmented Generation) API for intelligent document analysis",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content=ErrorResponse(error=str(exc)).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc) if settings.debug else None
        ).dict()
    )

# Health check endpoint
@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Check the health of all services."""
    try:
        # Check all services
        doc_health = await doc_processor.health_check()
        vector_health = await vector_store.health_check()
        embedding_health = await embedding_service.health_check()
        llm_health = await llm_service.health_check()
        
        all_healthy = all(
            service.get("status") == "healthy" 
            for service in [doc_health, vector_health, embedding_health, llm_health]
        )
        
        return HealthCheck(
            status="healthy" if all_healthy else "degraded",
            timestamp=datetime.utcnow(),
            services={
                "document_processor": doc_health.get("status", "unknown"),
                "vector_store": vector_health.get("status", "unknown"),
                "embeddings": embedding_health.get("status", "unknown"),
                "llm": llm_health.get("status", "unknown"),
            },
            version="1.0.0"
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthCheck(
            status="unhealthy",
            timestamp=datetime.utcnow(),
            services={"error": str(e)},
            version="1.0.0"
        )

# Document upload endpoint
@app.post("/api/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a PDF document."""
    try:
        # Read file content
        file_content = await file.read()
        
        # Save file
        document_id, file_path = await doc_processor.save_uploaded_file(
            file_content, file.filename
        )
        
        # Store document metadata
        documents_db[document_id] = {
            "id": document_id,
            "filename": file.filename,
            "size": len(file_content),
            "uploaded_at": datetime.utcnow(),
            "status": ProcessingStatus.UPLOADING,
            "file_path": file_path,
            "task_id": None
        }
        
        # Start background processing
        task = process_document.delay(
            document_id=document_id,
            file_path=file_path,
            filename=file.filename,
            metadata={"uploaded_by": "user"}  # In production, get from auth
        )
        
        # Update task ID
        documents_db[document_id]["task_id"] = task.id
        documents_db[document_id]["status"] = ProcessingStatus.PROCESSING
        
        logger.info(f"Started processing document {document_id} (task: {task.id})")
        
        return DocumentResponse(
            id=document_id,
            filename=file.filename,
            size=len(file_content),
            uploaded_at=datetime.utcnow(),
            status=ProcessingStatus.PROCESSING
        )
        
    except Exception as e:
        logger.error(f"Failed to upload document: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# Get document status
@app.get("/api/documents/{document_id}/status", response_model=DocumentResponse)
async def get_document_status(document_id: str):
    """Get the processing status of a document."""
    try:
        if document_id not in documents_db:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc_info = documents_db[document_id]
        
        # If still processing, check task status
        if doc_info["status"] == ProcessingStatus.PROCESSING and doc_info["task_id"]:
            from workers.celery_app import celery_app
            result = celery_app.AsyncResult(doc_info["task_id"])
            
            if result.state == "SUCCESS":
                task_result = result.result
                doc_info["status"] = task_result.get("status", ProcessingStatus.COMPLETED)
                doc_info["pages"] = task_result.get("pages")
            elif result.state == "FAILURE":
                doc_info["status"] = ProcessingStatus.FAILED
                doc_info["error"] = str(result.info)
        
        return DocumentResponse(
            id=doc_info["id"],
            filename=doc_info["filename"],
            size=doc_info["size"],
            uploaded_at=doc_info["uploaded_at"],
            status=doc_info["status"],
            pages=doc_info.get("pages"),
            error=doc_info.get("error")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get document status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get document status")

# List documents
@app.get("/api/documents", response_model=DocumentListResponse)
async def list_documents():
    """List all uploaded documents."""
    try:
        documents = []
        for doc_info in documents_db.values():
            documents.append(DocumentResponse(
                id=doc_info["id"],
                filename=doc_info["filename"],
                size=doc_info["size"],
                uploaded_at=doc_info["uploaded_at"],
                status=doc_info["status"],
                pages=doc_info.get("pages"),
                error=doc_info.get("error")
            ))
        
        # Sort by upload time (newest first)
        documents.sort(key=lambda x: x.uploaded_at, reverse=True)
        
        return DocumentListResponse(
            documents=documents,
            total=len(documents)
        )
        
    except Exception as e:
        logger.error(f"Failed to list documents: {e}")
        raise HTTPException(status_code=500, detail="Failed to list documents")

# Chat with document
@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_document(request: ChatRequest):
    """Chat with a specific document using RAG."""
    start_time = time.time()
    
    try:
        # Check if document exists and is processed
        if request.document_id not in documents_db:
            logger.error(f"Document {request.document_id} not found in documents_db. Available: {list(documents_db.keys())}")
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc_info = documents_db[request.document_id]
        logger.info(f"Document {request.document_id} status: {doc_info['status']}")
        
        if doc_info["status"] != ProcessingStatus.COMPLETED:
            logger.warning(f"Document {request.document_id} not ready. Status: {doc_info['status']}")
            raise HTTPException(
                status_code=400, 
                detail=f"Document is not ready for chat. Status: {doc_info['status']}"
            )
        
        # Debug: Check if chunks exist for this document
        doc_stats = await vector_store.get_document_stats(request.document_id)
        logger.info(f"Document {request.document_id} has {doc_stats.get('chunk_count', 0)} chunks in vector store")
        
        # Search for relevant content
        logger.info(f"Searching for: '{request.message}' in document {request.document_id}")
        search_results = await vector_store.search_similar(
            query=request.message,
            document_id=request.document_id,
            limit=5,
            score_threshold=0.5  # Lower threshold for debugging
        )
        
        logger.info(f"Vector search found {len(search_results)} chunks")
        for i, result in enumerate(search_results):
            logger.debug(f"Chunk {i}: score={result['score']:.3f}, content preview='{result['content'][:100]}...'")
        
        # Convert to SourceDocument format
        source_docs = []
        for result in search_results:
            source_docs.append(SourceDocument(
                content=result["content"],
                page_number=result.get("metadata", {}).get("page_number"),
                confidence_score=result["score"]
            ))
        
        # Generate response using LLM
        logger.info(f"Sending {len(source_docs)} source documents to LLM")
        llm_result = await llm_service.generate_response(
            query=request.message,
            context_documents=source_docs,
            conversation_history=request.conversation_history,
            document_filename=doc_info["filename"]
        )
        
        processing_time = time.time() - start_time
        logger.info(f"Chat response generated in {processing_time:.2f}s")
        
        return ChatResponse(
            response=llm_result["response"],
            sources=source_docs,
            document_id=request.document_id,
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat request failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to process chat request")

# Search documents
@app.post("/api/search", response_model=SearchResponse)
async def search_documents(request: SearchRequest):
    """Search across documents for relevant content."""
    start_time = time.time()
    
    try:
        # Perform vector search
        search_results = await vector_store.search_similar(
            query=request.query,
            document_id=request.document_id,
            limit=request.limit,
            score_threshold=0.6
        )
        
        # Format results
        formatted_results = []
        for result in search_results:
            formatted_results.append({
                "content": result["content"],
                "document_id": result["document_id"],
                "filename": result["filename"],
                "page_number": result.get("metadata", {}).get("page_number"),
                "confidence_score": result["score"]
            })
        
        processing_time = time.time() - start_time
        
        return SearchResponse(
            results=formatted_results,
            query=request.query,
            total_results=len(formatted_results),
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Search request failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to process search request")

# Delete document
@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str, background_tasks: BackgroundTasks):
    """Delete a document and all its data."""
    try:
        if document_id not in documents_db:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc_info = documents_db[document_id]
        
        # Start cleanup in background
        background_tasks.add_task(
            lambda: cleanup_document.delay(
                document_id=document_id,
                file_path=doc_info.get("file_path")
            )
        )
        
        # Remove from memory
        del documents_db[document_id]
        
        return {"message": f"Document {document_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete document: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete document")

# File serving endpoint
@app.get("/api/files/{document_id}")
async def serve_file(document_id: str):
    """Serve a PDF file."""
    try:
        if document_id not in documents_db:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc_info = documents_db[document_id]
        file_path = doc_info["file_path"]
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(file_path)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to serve file: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve file")

# Debug endpoints
@app.get("/api/debug/redis")
async def debug_redis():
    """Debug Redis connection health."""
    try:
        import redis
        r = redis.from_url(settings.redis_url)
        
        # Test basic operations
        r.ping()
        r.set("health_check", "ok", ex=10)
        value = r.get("health_check")
        
        return {
            "redis_status": "healthy",
            "ping": "OK",
            "read_write": "OK" if value == b"ok" else "FAILED"
        }
    except Exception as e:
        return {
            "redis_status": "unhealthy", 
            "error": str(e)
        }

@app.get("/api/debug/services")
async def debug_services():
    """Debug all service connections."""
    try:
        # Check all services
        doc_health = await doc_processor.health_check()
        vector_health = await vector_store.health_check()
        embedding_health = await embedding_service.health_check()
        llm_health = await llm_service.health_check()
        
        return {
            "document_processor": doc_health,
            "vector_store": vector_health,
            "embeddings": embedding_health,
            "llm": llm_health,
            "overall_status": "healthy" if all(
                service.get("status") == "healthy" 
                for service in [doc_health, vector_health, embedding_health, llm_health]
            ) else "degraded"
        }
        
    except Exception as e:
        return {
            "overall_status": "unhealthy",
            "error": str(e)
        }

# Run server
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    ) 