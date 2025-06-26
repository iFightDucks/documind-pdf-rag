"""LLM service for chat interactions using OpenRouter API."""

import asyncio
import logging
import time
from typing import List, Dict, Any, Optional
import httpx
from openai import AsyncOpenAI

from ..config import settings
from ..models import ChatMessage, SourceDocument

logger = logging.getLogger(__name__)


class LLMService:
    """Service for LLM interactions using OpenRouter API."""
    
    def __init__(self):
        self.client = None
        self.model = settings.openrouter_model
        self.base_url = "https://openrouter.ai/api/v1"
        self.max_tokens = 4000
        self.temperature = 0.1
    
    async def initialize(self):
        """Initialize the LLM service."""
        try:
            if not settings.openrouter_api_key:
                raise ValueError("OPENROUTER_API_KEY not found in environment variables")
            
            self.client = AsyncOpenAI(
                api_key=settings.openrouter_api_key,
                base_url=self.base_url
            )
            
            # Test connection
            await self._test_connection()
            logger.info("LLM service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize LLM service: {e}")
            raise
    
    async def _test_connection(self):
        """Test the LLM service connection."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            
            if not response.choices:
                raise ValueError("No response from LLM service")
                
        except Exception as e:
            logger.error(f"LLM service connection test failed: {e}")
            raise
    
    async def generate_response(
        self,
        query: str,
        context_documents: List[SourceDocument],
        conversation_history: List[ChatMessage] = None,
        document_filename: str = None
    ) -> Dict[str, Any]:
        """
        Generate a response using the LLM with RAG context.
        
        Args:
            query: User query
            context_documents: Relevant document chunks
            conversation_history: Previous conversation messages
            document_filename: Name of the document being queried
            
        Returns:
            Dict containing response and metadata
        """
        start_time = time.time()
        
        try:
            # Build context from documents
            context = self._build_context(context_documents, document_filename)
            
            # Build conversation messages
            messages = self._build_messages(query, context, conversation_history)
            
            # Generate response
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                stream=False
            )
            
            if not response.choices:
                raise ValueError("No response generated from LLM")
            
            assistant_response = response.choices[0].message.content
            processing_time = time.time() - start_time
            
            logger.info(f"Generated LLM response in {processing_time:.2f}s")
            
            return {
                "response": assistant_response,
                "processing_time": processing_time,
                "model": self.model,
                "tokens_used": response.usage.total_tokens if response.usage else None
            }
            
        except Exception as e:
            logger.error(f"Failed to generate LLM response: {e}")
            raise
    
    def _build_context(
        self, 
        context_documents: List[SourceDocument], 
        document_filename: str = None
    ) -> str:
        """Build context string from relevant documents."""
        if not context_documents:
            return "No relevant context found in the document."
        
        context_parts = []
        
        if document_filename:
            context_parts.append(f"Document: {document_filename}\n")
        
        context_parts.append("Relevant excerpts from the document:\n")
        
        for i, doc in enumerate(context_documents, 1):
            page_info = f" (Page {doc.page_number})" if doc.page_number else ""
            confidence_info = f" [Relevance: {doc.confidence_score:.2f}]"
            
            context_parts.append(
                f"\n--- Excerpt {i}{page_info}{confidence_info} ---\n"
                f"{doc.content}\n"
            )
        
        return "".join(context_parts)
    
    def _build_messages(
        self,
        query: str,
        context: str,
        conversation_history: List[ChatMessage] = None
    ) -> List[Dict[str, str]]:
        """Build the message list for the LLM."""
        
        system_prompt = """You are DOCUMIND, an intelligent document analysis assistant. Your role is to help users understand and extract information from their documents through natural conversation.

Guidelines:
1. Answer questions based ONLY on the provided document context
2. If information isn't in the context, clearly state that you cannot find it in the document
3. Provide specific references to page numbers when available
4. Be concise but comprehensive in your responses
5. Maintain a helpful and professional tone
6. If asked about topics not covered in the document, politely redirect to document-related questions

Always base your responses on the document content provided in the context."""

        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history if available
        if conversation_history:
            for msg in conversation_history[-10:]:  # Keep last 10 messages for context
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # Add current query with context
        user_message = f"""Context from document:
{context}

User question: {query}

Please answer the question based on the provided context."""
        
        messages.append({"role": "user", "content": user_message})
        
        return messages
    
    async def summarize_document(
        self, 
        document_chunks: List[str], 
        filename: str
    ) -> str:
        """Generate a summary of the document."""
        try:
            # Combine chunks with reasonable limit
            max_content_length = 15000  # Adjust based on model limits
            combined_content = ""
            
            for chunk in document_chunks:
                if len(combined_content) + len(chunk) > max_content_length:
                    break
                combined_content += chunk + "\n\n"
            
            messages = [
                {
                    "role": "system",
                    "content": "You are a document analysis assistant. Create a comprehensive summary of the provided document content."
                },
                {
                    "role": "user",
                    "content": f"""Please provide a comprehensive summary of this document: {filename}

Document content:
{combined_content}

Create a summary that includes:
1. Main topic/purpose
2. Key points and findings
3. Important details
4. Structure/organization

Keep the summary informative but concise."""
                }
            ]
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1000,
                temperature=0.1
            )
            
            if response.choices:
                return response.choices[0].message.content
            else:
                return "Unable to generate summary."
                
        except Exception as e:
            logger.error(f"Failed to generate document summary: {e}")
            return "Error generating summary."
    
    async def health_check(self) -> Dict[str, str]:
        """Check LLM service health."""
        try:
            if not settings.openrouter_api_key:
                return {"status": "unhealthy", "error": "API key not configured"}
            
            # Test with a simple request
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5
            )
            
            if not response.choices:
                return {"status": "unhealthy", "error": "No response from LLM"}
            
            return {
                "status": "healthy",
                "model": self.model
            }
            
        except Exception as e:
            logger.error(f"LLM service health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)} 