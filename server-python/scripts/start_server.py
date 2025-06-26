#!/usr/bin/env python3
"""
Script to start the DOCUMIND FastAPI server.
"""

import sys
import os

# Add the parent directory to the Python path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uvicorn
from app.config import settings


def main():
    """Start the FastAPI server."""
    print("🚀 Starting DOCUMIND FastAPI Server...")
    print(f"📡 Host: {settings.host}")
    print(f"🔌 Port: {settings.port}")
    print(f"🐛 Debug: {settings.debug}")
    print(f"🌐 CORS Origins: {settings.cors_origins}")
    print("-" * 50)
    
    try:
        uvicorn.run(
            "app.main:app",
            host=settings.host,
            port=settings.port,
            reload=settings.debug,
            log_level="info" if not settings.debug else "debug",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n👋 Server shutdown requested by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 