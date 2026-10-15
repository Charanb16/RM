"""Development settings for RoadMate project."""
from .base import *  # noqa: F403

DEBUG = True

# Allow all origins in local development for frontend convenience
CORS_ALLOW_ALL_ORIGINS = True

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Show detailed SQL and debug logs
LOGGING['handlers']['console']['formatter'] = 'standard'
LOGGING['loggers']['django.db.backends'] = {
    'handlers': ['console'],
    'level': 'DEBUG',
    'propagate': False,
}
