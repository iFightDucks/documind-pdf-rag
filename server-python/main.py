#!/usr/bin/env python3
"""
DOCUMIND Server - Main entry point.

This is a convenience script that can be used to start the server directly.
For production, use the scripts in the scripts/ directory.
"""

import uvicorn
from app.config import settings


def main():
    """Start the DOCUMIND server."""
    print("🚀 Starting DOCUMIND Server...")
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )


if __name__ == "__main__":
    main() 