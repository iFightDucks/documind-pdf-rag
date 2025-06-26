# DOCUMIND Server - Python Backend

A high-performance PDF RAG (Retrieval-Augmented Generation) API built with FastAPI, providing intelligent document analysis and chat capabilities.

## 🚀 Features

- **PDF Processing**: Extract text and metadata from PDF documents
- **Vector Search**: Store and search document chunks using Qdrant vector database
- **AI Chat**: Chat with your documents using OpenRouter LLMs
- **Background Processing**: Async document processing with Celery workers
- **Modern API**: FastAPI with automatic documentation and validation
- **Production Ready**: Redis for caching, comprehensive logging, health checks

## 🏗️ Architecture

- **FastAPI**: Modern, fast web framework for APIs
- **Qdrant Cloud**: Vector database for semantic search
- **Redis Cloud**: Message broker and caching
- **Celery**: Distributed task queue for background processing
- **Nomic AI**: High-quality text embeddings
- **OpenRouter**: Access to multiple LLMs (DeepSeek Chat)

## 📋 Prerequisites

- Python 3.12+
- UV package manager (recommended) or pip
- Access to cloud services:
  - Qdrant Cloud account
  - Redis Cloud account
  - Nomic AI API key
  - OpenRouter API key

## 🛠️ Installation

1. **Clone and setup environment**:
   ```bash
   cd server-python
   uv sync  # or pip install -r requirements.txt
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   ```env
   # API Keys
   NOMIC_API_KEY=your_nomic_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   
   # Cloud Services
   QDRANT_URL=your_qdrant_cloud_url
   QDRANT_API_KEY=your_qdrant_api_key
   REDIS_URL=your_redis_cloud_url
   
   # Server Configuration
   HOST=0.0.0.0
   PORT=3001
   DEBUG=true
   ```

## 🚀 Usage

### Development Mode

1. **Start the FastAPI server**:
   ```bash
   # Using the convenience script
   python scripts/start_server.py
   
   # Or directly
   python main.py
   
   # Or with uvicorn
   uvicorn app.main:app --reload
   ```

2. **Start the Celery worker** (in a separate terminal):
   ```bash
   python scripts/start_worker.py
   
   # Or directly with celery
   celery -A workers.celery_app.celery_app worker --loglevel=info --pool=solo
   ```

3. **Access the API**:
   - API: http://localhost:3001
   - Documentation: http://localhost:3001/docs
   - Health Check: http://localhost:3001/health

### Production Mode

Use Docker Compose (recommended):
```bash
cd ..  # Go to project root
docker-compose up -d
```

## 📡 API Endpoints

### Documents
- `POST /api/upload` - Upload a PDF document
- `GET /api/documents` - List all documents
- `GET /api/documents/{document_id}` - Get document details
- `DELETE /api/documents/{document_id}` - Delete document
- `GET /api/documents/{document_id}/file` - Download original file

### Chat
- `POST /api/chat` - Chat with a document using RAG
- `GET /api/chat/history/{document_id}` - Get chat history

### Search
- `POST /api/search` - Search across documents
- `GET /api/search/suggestions` - Get search suggestions

### System
- `GET /health` - Health check
- `GET /api/status/{task_id}` - Get background task status

## 🧪 Testing

Run the test suite:
```bash
pytest tests/ -v
```

Test individual components:
```bash
# Test vector store
python -m pytest tests/test_vector_store.py

# Test document processing
python -m pytest tests/test_document_processor.py
```

## 🐛 Debugging

### Enable Debug Logging
Set `DEBUG=true` in your `.env` file for detailed logs.

### Debug Endpoints
- `GET /api/debug/redis` - Check Redis connection
- `GET /api/debug/services` - Check all service health
- `GET /api/debug/qdrant` - Check Qdrant connection

### Common Issues

1. **Celery worker not starting**:
   - Check Redis connection
   - Ensure all dependencies are installed
   - Use `--pool=solo` on Windows

2. **Documents not processing**:
   - Check Celery worker is running
   - Verify API keys in environment
   - Check upload directory permissions

3. **Chat returning generic responses**:
   - Ensure document processing completed
   - Check vector store has document chunks
   - Verify Qdrant connection and collection

## 📁 Project Structure

```
server-python/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── models.py            # Pydantic models
│   └── services/
│       ├── __init__.py
│       ├── vector_store.py  # Qdrant integration
│       ├── embeddings.py    # Nomic AI embeddings
│       ├── llm.py          # OpenRouter LLM integration
│       └── document_processor.py  # PDF processing
├── workers/
│   ├── __init__.py
│   ├── celery_app.py       # Celery configuration
│   └── document_tasks.py   # Background tasks
├── scripts/
│   ├── start_server.py     # Server startup script
│   └── start_worker.py     # Worker startup script
├── uploads/                # Document storage
├── main.py                 # Entry point
├── pyproject.toml         # Dependencies
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `3001` |
| `DEBUG` | Debug mode | `true` |
| `UPLOAD_DIR` | File upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `52428800` (50MB) |
| `CHUNK_SIZE` | Text chunk size | `1000` |
| `CHUNK_OVERLAP` | Chunk overlap | `200` |

### Service Configuration

All services are configured via environment variables. See `.env.example` for a complete list.

## 📊 Monitoring

### Health Checks
The API includes comprehensive health checks for all services:
- FastAPI server
- Redis connection
- Qdrant vector database
- Celery workers
- AI services (Nomic, OpenRouter)

### Logging
Structured logging with different levels:
- `DEBUG`: Detailed information
- `INFO`: General information
- `WARNING`: Warning messages
- `ERROR`: Error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Check the [Issues](https://github.com/your-org/documind/issues) page
- Read the [API Documentation](http://localhost:3001/docs)
- Join our [Discord](https://discord.gg/documind) community 