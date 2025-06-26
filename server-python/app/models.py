"""Pydantic models for DOCUMIND API."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


class ProcessingStatus(str, Enum):
    """Document processing status."""
    UPLOADING = "uploading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ChatMessage(BaseModel):
    """Chat message model."""
    role: str = Field(..., description="Message role (user or assistant)")
    content: str = Field(..., description="Message content")


class DocumentResponse(BaseModel):
    """Document response model."""
    id: str = Field(..., description="Document ID")
    filename: str = Field(..., description="Original filename")
    size: int = Field(..., description="File size in bytes")
    uploaded_at: datetime = Field(..., description="Upload timestamp")
    status: ProcessingStatus = Field(..., description="Processing status")
    pages: Optional[int] = Field(None, description="Number of pages")
    error: Optional[str] = Field(None, description="Error message if failed")


class DocumentListResponse(BaseModel):
    """List of documents response."""
    documents: List[DocumentResponse] = Field(..., description="List of documents")
    total: int = Field(..., description="Total number of documents")


class ChatRequest(BaseModel):
    """Chat request model."""
    message: str = Field(..., description="User message")
    document_id: str = Field(..., description="Document ID to chat with")
    conversation_history: Optional[List[ChatMessage]] = Field(
        default=[], description="Previous conversation messages"
    )


class SourceDocument(BaseModel):
    """Source document chunk."""
    content: str = Field(..., description="Document content")
    page_number: Optional[int] = Field(None, description="Page number")
    confidence_score: float = Field(..., description="Relevance score")


class ChatResponse(BaseModel):
    """Chat response model."""
    response: str = Field(..., description="AI response")
    sources: List[SourceDocument] = Field(..., description="Source documents")
    document_id: str = Field(..., description="Document ID")
    processing_time: float = Field(..., description="Processing time in seconds")


class SearchRequest(BaseModel):
    """Search request model."""
    query: str = Field(..., description="Search query")
    document_id: Optional[str] = Field(None, description="Optional document ID filter")
    limit: int = Field(default=10, description="Maximum results")


class SearchResult(BaseModel):
    """Individual search result."""
    content: str = Field(..., description="Matching content")
    document_id: str = Field(..., description="Source document ID")
    filename: str = Field(..., description="Source filename")
    page_number: Optional[int] = Field(None, description="Page number")
    confidence_score: float = Field(..., description="Match confidence score")


class SearchResponse(BaseModel):
    """Search response model."""
    results: List[SearchResult] = Field(..., description="Search results")
    query: str = Field(..., description="Original query")
    total_results: int = Field(..., description="Total number of results")
    processing_time: float = Field(..., description="Processing time in seconds")


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")


class HealthCheck(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Overall health status")
    timestamp: datetime = Field(..., description="Check timestamp")
    services: Dict[str, Any] = Field(..., description="Individual service statuses")
    version: str = Field(..., description="Application version") 