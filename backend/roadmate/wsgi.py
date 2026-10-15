"""WSGI config for RoadMate project."""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'roadmate.settings.development')

application = get_wsgi_application()
