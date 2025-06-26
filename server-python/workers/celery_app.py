"""Celery application configuration for background tasks."""

import logging
from celery import Celery
from app.config import settings

logger = logging.getLogger(__name__)

# Create Celery app
celery_app = Celery(
    "documind_worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["workers.document_tasks"]
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Redis Connection Resilience Settings
    broker_connection_retry_on_startup=True,
    broker_connection_retry=True,
    broker_connection_max_retries=10,
    
    # Connection timeout settings
    broker_transport_options={
        'socket_timeout': 30,
        'socket_connect_timeout': 30,
        'socket_keepalive': True,
        'retry_on_timeout': True,
        'health_check_interval': 30,
        'visibility_timeout': 3600,
    },
    
    # Result backend settings
    result_expires=3600,  # 1 hour
    result_backend_transport_options={
        "visibility_timeout": 3600,
        'socket_timeout': 30,
        'retry_on_timeout': True,
    },
    
    # Worker settings
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
    worker_pool="solo",  # Use solo pool on Windows to avoid multiprocessing issues
    
    # Connection loss handling
    task_reject_on_worker_lost=True,
    worker_cancel_long_running_tasks_on_connection_loss=True,
    
    # Task routing
    task_routes={
        "workers.document_tasks.process_document": {"queue": "document_processing"},
        "workers.document_tasks.cleanup_document": {"queue": "cleanup"},
    },
    
    # Default queue
    task_default_queue="default",
    
    # Retry settings
    task_default_retry_delay=60,  # 1 minute
    task_max_retries=3,
    
    # Logging
    worker_hijack_root_logger=False,
    worker_log_format="[%(asctime)s: %(levelname)s/%(name)s] %(message)s",
    worker_task_log_format="[%(asctime)s: %(levelname)s/%(name)s][%(task_name)s(%(task_id)s)] %(message)s"
)

# Health check task
@celery_app.task(bind=True)
def health_check(self):
    """Health check task for Celery worker."""
    return {"status": "healthy", "worker_id": self.request.id} 