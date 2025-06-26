"""Document processor service for PDF handling."""

import asyncio
import logging
import os
import uuid
from typing import Dict, Any, Tuple
import aiofiles
from PyPDF2 import PdfReader

from ..config import settings

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Service for processing PDF documents."""
    
    def __init__(self):
        self.upload_dir = settings.upload_dir
    
    async def initialize(self):
        """Initialize the document processor."""
        try:
            # Create upload directory if it doesn't exist
            os.makedirs(self.upload_dir, exist_ok=True)
            logger.info("Document processor initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize document processor: {e}")
            raise
    
    async def save_uploaded_file(self, file_content: bytes, filename: str) -> Tuple[str, str]:
        """
        Save uploaded file to disk.
        
        Args:
            file_content: Raw file content
            filename: Original filename
            
        Returns:
            Tuple of (document_id, file_path)
        """
        try:
            # Generate unique document ID
            document_id = str(uuid.uuid4())
            
            # Create file path with timestamp and original name
            timestamp = int(asyncio.get_event_loop().time() * 1000)
            safe_filename = f"{timestamp}-{uuid.uuid4().hex[:8]}-{filename}"
            file_path = os.path.join(self.upload_dir, safe_filename)
            
            # Write file asynchronously
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(file_content)
            
            logger.info(f"Saved file {filename} as {file_path} with ID {document_id}")
            return document_id, file_path
            
        except Exception as e:
            logger.error(f"Failed to save uploaded file {filename}: {e}")
            raise
    
    async def extract_text_from_pdf(self, file_path: str) -> Tuple[str, Dict[str, Any]]:
        """
        Extract text from PDF file.
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            Tuple of (extracted_text, metadata)
        """
        try:
            # Read PDF in executor to avoid blocking
            loop = asyncio.get_event_loop()
            text, metadata = await loop.run_in_executor(
                None, self._extract_text_sync, file_path
            )
            
            logger.info(f"Extracted {len(text)} characters from {metadata['page_count']} pages")
            return text, metadata
            
        except Exception as e:
            logger.error(f"Failed to extract text from PDF {file_path}: {e}")
            raise
    
    def _extract_text_sync(self, file_path: str) -> Tuple[str, Dict[str, Any]]:
        """Synchronous PDF text extraction."""
        try:
            with open(file_path, 'rb') as f:
                pdf_reader = PdfReader(f)
                
                # Extract text from all pages
                text_parts = []
                for page_num, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()
                    if page_text.strip():
                        text_parts.append(f"[Page {page_num + 1}]\n{page_text}\n")
                
                full_text = "\n".join(text_parts)
                
                # Extract metadata
                metadata = {
                    "page_count": len(pdf_reader.pages),
                    "text_length": len(full_text),
                    "file_size": os.path.getsize(file_path),
                    "file_path": file_path
                }
                
                # Add PDF metadata if available
                if pdf_reader.metadata:
                    metadata.update({
                        "title": pdf_reader.metadata.get("/Title", ""),
                        "author": pdf_reader.metadata.get("/Author", ""),
                        "subject": pdf_reader.metadata.get("/Subject", ""),
                        "creator": pdf_reader.metadata.get("/Creator", "")
                    })
                
                return full_text, metadata
                
        except Exception as e:
            raise Exception(f"PDF processing error: {str(e)}")
    
    async def delete_file(self, file_path: str):
        """Delete a file from disk."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Deleted file: {file_path}")
            else:
                logger.warning(f"File not found for deletion: {file_path}")
        except Exception as e:
            logger.error(f"Failed to delete file {file_path}: {e}")
            raise
    
    async def get_file_info(self, file_path: str) -> Dict[str, Any]:
        """Get information about a file."""
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
            
            stat = os.stat(file_path)
            return {
                "size": stat.st_size,
                "created": stat.st_ctime,
                "modified": stat.st_mtime,
                "exists": True
            }
        except Exception as e:
            logger.error(f"Failed to get file info for {file_path}: {e}")
            return {"exists": False, "error": str(e)}
    
    async def health_check(self) -> Dict[str, str]:
        """Check document processor health."""
        try:
            # Check if upload directory is accessible
            if not os.path.exists(self.upload_dir):
                return {"status": "unhealthy", "error": "Upload directory not accessible"}
            
            # Check write permissions
            test_file = os.path.join(self.upload_dir, ".health_check")
            try:
                with open(test_file, 'w') as f:
                    f.write("health_check")
                os.remove(test_file)
            except Exception as e:
                return {"status": "unhealthy", "error": f"Write permission error: {str(e)}"}
            
            return {"status": "healthy"}
            
        except Exception as e:
            logger.error(f"Document processor health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)} 