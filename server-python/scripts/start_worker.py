#!/usr/bin/env python3
"""
Script to start the DOCUMIND Celery worker.
"""

import sys
import os
import subprocess

# Add the parent directory to the Python path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main():
    """Start the Celery worker."""
    print("🔧 Starting DOCUMIND Celery Worker...")
    print("📋 Available queues: default, document_processing, cleanup")
    print("⚙️  Worker pool: solo (Windows compatible)")
    print("-" * 50)
    
    try:
        # Change to the server-python directory
        server_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        os.chdir(server_dir)
        
        # Start Celery worker with appropriate settings
        cmd = [
            sys.executable, "-m", "celery",
            "--app=workers.celery_app.celery_app",
            "worker",
            "--loglevel=info",
            "--pool=solo",  # Windows compatible
            "--queues=default,document_processing,cleanup",
            "--hostname=documind_worker@%h"
        ]
        
        print(f"🚀 Running command: {' '.join(cmd)}")
        print("-" * 50)
        
        # Execute Celery worker
        process = subprocess.run(cmd, check=False)
        sys.exit(process.returncode)
        
    except KeyboardInterrupt:
        print("\n👋 Worker shutdown requested by user")
    except Exception as e:
        print(f"❌ Failed to start worker: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 