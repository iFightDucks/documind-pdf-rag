"""Configuration settings for DOCUMIND server."""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Server Configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=3001, env="PORT")
    debug: bool = Field(default=True, env="DEBUG")
    cors_origins: list[str] = Field(
        default=["http://localhost:3000"], 
        env="CORS_ORIGINS"
    )
    
    # Redis Configuration
    redis_url: str = Field(
        default="redis://localhost:6379",
        env="REDIS_URL"
    )
    redis_user_key: Optional[str] = Field(default=None, env="REDIS_USER_KEY")
    redis_account_key: Optional[str] = Field(default=None, env="REDIS_ACCOUNT_KEY")
    
    # Qdrant Configuration
    qdrant_url: str = Field(
        default="https://3a6d6b3c-7e55-4ba6-acdc-ca7d60ac30b8.us-east4-0.gcp.cloud.qdrant.io",
        env="QDRANT_URL"
    )
    qdrant_api_key: Optional[str] = Field(default=None, env="QDRANT_API_KEY")
    qdrant_collection: Optional[str] = Field(default=None, env="QDRANT_COLLECTION")
    
    # AI/LLM Configuration
    nomic_api_key: Optional[str] = Field(default=None, env="NOMIC_API_KEY")
    openrouter_api_key: Optional[str] = Field(default=None, env="OPENROUTER_API_KEY")
    openrouter_model: str = Field(default="deepseek/deepseek-chat", env="OPENROUTER_MODEL")
    
    # File Upload Configuration
    upload_dir: str = Field(default="./uploads", env="UPLOAD_DIR")
    max_file_size: int = Field(default=50 * 1024 * 1024, env="MAX_FILE_SIZE")  # 50MB
    allowed_extensions: list[str] = Field(default=[".pdf"], env="ALLOWED_EXTENSIONS")
    
    # Processing Configuration
    chunk_size: int = Field(default=1000, env="CHUNK_SIZE")
    chunk_overlap: int = Field(default=200, env="CHUNK_OVERLAP")
    
    # Collection Configuration
    collection_name: str = Field(default="documind", env="COLLECTION_NAME")
    
    @property
    def effective_collection_name(self) -> str:
        """Get the effective collection name, prioritizing qdrant_collection over collection_name."""
        return self.qdrant_collection or self.collection_name
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings() 