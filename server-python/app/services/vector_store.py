"""Vector store service for document embeddings using Qdrant."""

import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from uuid import uuid4

from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from langchain.text_splitter import RecursiveCharacterTextSplitter

from ..config import settings
from .embeddings import EmbeddingService

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Service for managing vector operations with Qdrant."""
    
    def __init__(self):
        self.client = None
        self.embedding_service = EmbeddingService()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", " ", ""]
        )
    
    async def initialize(self):
        """Initialize Qdrant client and ensure collection exists."""
        try:
            self.client = QdrantClient(
                url=settings.qdrant_url,
                api_key=settings.qdrant_api_key,
            )
            
            # Check if collection exists, create if not
            await self.ensure_collection_exists()
            logger.info("Vector store initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")
            raise
    
    async def ensure_collection_exists(self):
        """Ensure the document collection exists in Qdrant."""
        try:
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if settings.effective_collection_name not in collection_names:
                logger.info(f"Creating collection: {settings.effective_collection_name}")
                
                self.client.create_collection(
                    collection_name=settings.effective_collection_name,
                    vectors_config=VectorParams(
                        size=768,  # Nomic embedding dimension
                        distance=Distance.COSINE
                    )
                )
                logger.info("Collection created successfully")
            else:
                logger.info(f"Collection {settings.effective_collection_name} already exists")
            
            # Create payload index for document_id field to enable filtering
            try:
                self.client.create_payload_index(
                    collection_name=settings.effective_collection_name,
                    field_name="document_id",
                    field_schema="keyword"
                )
                logger.info("Created payload index for document_id field")
            except Exception as e:
                # Index might already exist, log warning but don't fail
                if "already exists" in str(e).lower():
                    logger.info("Payload index for document_id already exists")
                else:
                    logger.warning(f"Failed to create payload index for document_id: {e}")
                
        except Exception as e:
            logger.error(f"Failed to ensure collection exists: {e}")
            raise
    
    async def process_document(
        self, 
        document_id: str, 
        text: str, 
        filename: str,
        metadata: Dict[str, Any] = None
    ) -> int:
        """
        Process and store document chunks in vector store.
        
        Returns:
            Number of chunks processed
        """
        try:
            # Split text into chunks
            chunks = self.text_splitter.split_text(text)
            logger.info(f"Split document {document_id} into {len(chunks)} chunks")
            
            if not chunks:
                logger.warning(f"No chunks generated for document {document_id}")
                return 0
            
            # Generate embeddings for all chunks
            embeddings = await self.embedding_service.get_embeddings(chunks)
            
            # Prepare points for Qdrant
            points = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                point_id = str(uuid4())
                
                point_metadata = {
                    "document_id": document_id,
                    "filename": filename,
                    "chunk_index": i,
                    "content": chunk,
                    "chunk_size": len(chunk),
                    **(metadata or {})
                }
                
                points.append(
                    PointStruct(
                        id=point_id,
                        vector=embedding,
                        payload=point_metadata
                    )
                )
            
            # Upload to Qdrant in batches
            batch_size = 100
            for i in range(0, len(points), batch_size):
                batch = points[i:i + batch_size]
                self.client.upsert(
                    collection_name=settings.effective_collection_name,
                    points=batch
                )
                logger.debug(f"Uploaded batch {i//batch_size + 1} for document {document_id}")
            
            logger.info(f"Successfully processed {len(chunks)} chunks for document {document_id}")
            return len(chunks)
            
        except Exception as e:
            logger.error(f"Failed to process document {document_id}: {e}")
            raise
    
    async def search_similar(
        self, 
        query: str, 
        document_id: Optional[str] = None,
        limit: int = 5,
        score_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Search for similar chunks in the vector store.
        
        Args:
            query: Search query
            document_id: Optional document ID to filter by
            limit: Maximum number of results
            score_threshold: Minimum similarity score
            
        Returns:
            List of matching chunks with metadata
        """
        try:
            logger.info(f"Vector search: query='{query}', document_id={document_id}, limit={limit}, threshold={score_threshold}")
            
            # Get query embedding
            query_embedding = await self.embedding_service.get_embeddings([query])
            logger.debug(f"Generated query embedding with dimension: {len(query_embedding[0])}")
            
            # Prepare search filter
            search_filter = None
            if document_id:
                search_filter = models.Filter(
                    must=[
                        models.FieldCondition(
                            key="document_id",
                            match=models.MatchValue(value=document_id)
                        )
                    ]
                )
                logger.info(f"Using document filter for document_id: {document_id}")
            
            # Perform search
            search_results = self.client.search(
                collection_name=settings.effective_collection_name,
                query_vector=query_embedding[0],
                query_filter=search_filter,
                limit=limit,
                score_threshold=score_threshold
            )
            
            logger.info(f"Qdrant returned {len(search_results)} results")
            
            # Format results
            results = []
            for result in search_results:
                results.append({
                    "content": result.payload["content"],
                    "document_id": result.payload["document_id"],
                    "filename": result.payload["filename"],
                    "chunk_index": result.payload["chunk_index"],
                    "score": result.score,
                    "metadata": {k: v for k, v in result.payload.items() 
                              if k not in ["content", "document_id", "filename", "chunk_index"]}
                })
            
            logger.info(f"Found {len(results)} similar chunks for query")
            return results
            
        except Exception as e:
            logger.error(f"Failed to search similar chunks: {e}")
            raise
    
    async def delete_document(self, document_id: str) -> int:
        """
        Delete all chunks for a document.
        
        Returns:
            Number of chunks deleted
        """
        try:
            # Get all points for the document
            search_results = self.client.scroll(
                collection_name=settings.effective_collection_name,
                scroll_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="document_id",
                            match=models.MatchValue(value=document_id)
                        )
                    ]
                ),
                limit=10000  # Large limit to get all chunks
            )
            
            if not search_results[0]:  # No points found
                logger.info(f"No chunks found for document {document_id}")
                return 0
            
            # Extract point IDs
            point_ids = [point.id for point in search_results[0]]
            
            # Delete points
            self.client.delete(
                collection_name=settings.effective_collection_name,
                points_selector=models.PointIdsList(
                    points=point_ids
                )
            )
            
            logger.info(f"Deleted {len(point_ids)} chunks for document {document_id}")
            return len(point_ids)
            
        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {e}")
            raise
    
    async def get_document_stats(self, document_id: str) -> Dict[str, Any]:
        """Get statistics for a document."""
        try:
            search_results = self.client.scroll(
                collection_name=settings.effective_collection_name,
                scroll_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="document_id",
                            match=models.MatchValue(value=document_id)
                        )
                    ]
                ),
                limit=10000
            )
            
            if not search_results[0]:
                return {"chunk_count": 0}
            
            chunks = search_results[0]
            total_content_length = sum(len(chunk.payload.get("content", "")) for chunk in chunks)
            
            return {
                "chunk_count": len(chunks),
                "total_content_length": total_content_length,
                "average_chunk_size": total_content_length / len(chunks) if chunks else 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get document stats for {document_id}: {e}")
            return {"chunk_count": 0}
    
    async def health_check(self) -> Dict[str, str]:
        """Check vector store health."""
        try:
            collections = self.client.get_collections()
            return {"status": "healthy", "collections": len(collections.collections)}
        except Exception as e:
            logger.error(f"Vector store health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)} 