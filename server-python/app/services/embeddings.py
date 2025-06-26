"""Embeddings service using Nomic AI."""

import asyncio
import logging
from typing import List
import httpx
from nomic import embed

from ..config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating text embeddings using Nomic AI."""
    
    def __init__(self):
        self.api_key = settings.nomic_api_key
        self.model = "nomic-embed-text-v1"
        self.dimension = 768
    
    async def initialize(self):
        """Initialize the embedding service."""
        try:
            if not self.api_key:
                raise ValueError("NOMIC_API_KEY not found in environment variables")
            
            # Set the API key for nomic library
            import nomic
            nomic.login(self.api_key)
            
            # Test the service with a simple embedding
            await self._test_embedding()
            logger.info("Embedding service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize embedding service: {e}")
            raise
    
    async def _test_embedding(self):
        """Test the embedding service with a simple query."""
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, 
                lambda: embed.text(
                    ["test"], 
                    model=self.model,
                    task_type="search_document"
                )
            )
            
            if not result or not result['embeddings']:
                raise ValueError("Failed to generate test embedding")
                
        except Exception as e:
            logger.error(f"Embedding service test failed: {e}")
            raise
    
    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors
        """
        try:
            if not texts:
                return []
            
            logger.debug(f"Generating embeddings for {len(texts)} texts")
            
            # Run embedding generation in executor to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                self._generate_embeddings_sync,
                texts
            )
            
            logger.debug(f"Generated {len(result)} embeddings")
            return result
            
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise
    
    def _generate_embeddings_sync(self, texts: List[str]) -> List[List[float]]:
        """Synchronous embedding generation."""
        try:
            # Use nomic embed API
            result = embed.text(
                texts,
                model=self.model,
                task_type="search_document"
            )
            
            if not result or 'embeddings' not in result:
                raise ValueError("Invalid response from Nomic API")
            
            embeddings = result['embeddings']
            
            # Validate embedding dimensions
            for i, embedding in enumerate(embeddings):
                if len(embedding) != self.dimension:
                    raise ValueError(f"Unexpected embedding dimension for text {i}: {len(embedding)} != {self.dimension}")
            
            return embeddings
            
        except Exception as e:
            raise Exception(f"Nomic embedding generation failed: {str(e)}")
    
    async def get_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for a search query.
        
        Args:
            query: Search query string
            
        Returns:
            Query embedding vector
        """
        try:
            logger.debug(f"Generating query embedding for: '{query}'")
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                self._generate_query_embedding_sync,
                query
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to generate query embedding: {e}")
            raise
    
    def _generate_query_embedding_sync(self, query: str) -> List[float]:
        """Synchronous query embedding generation."""
        try:
            # Use nomic embed API with search_query task type
            result = embed.text(
                [query],
                model=self.model,
                task_type="search_query"
            )
            
            if not result or 'embeddings' not in result or not result['embeddings']:
                raise ValueError("Invalid response from Nomic API")
            
            embedding = result['embeddings'][0]
            
            # Validate embedding dimension
            if len(embedding) != self.dimension:
                raise ValueError(f"Unexpected embedding dimension: {len(embedding)} != {self.dimension}")
            
            return embedding
            
        except Exception as e:
            raise Exception(f"Nomic query embedding generation failed: {str(e)}")
    
    async def health_check(self) -> dict:
        """Check embedding service health."""
        try:
            if not self.api_key:
                return {"status": "unhealthy", "error": "API key not configured"}
            
            # Test with a simple embedding
            test_embedding = await self.get_embeddings(["health check"])
            
            if not test_embedding or len(test_embedding) != 1:
                return {"status": "unhealthy", "error": "Invalid embedding response"}
            
            if len(test_embedding[0]) != self.dimension:
                return {"status": "unhealthy", "error": f"Wrong embedding dimension: {len(test_embedding[0])}"}
            
            return {
                "status": "healthy",
                "model": self.model,
                "dimension": self.dimension
            }
            
        except Exception as e:
            logger.error(f"Embedding service health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)}