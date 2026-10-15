"""ASGI config for RoadMate project.

Exposes the ASGI callable as a module-level variable named ``application``.
Handles both HTTP requests and real-time WebSocket connections with JWT authentication.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'roadmate.settings.development')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from channels.security.websocket import AllowedHostsOriginValidator  # noqa: E402
from core.channels_middleware import JWTAuthMiddlewareStack  # noqa: E402
import assistance.routing  # noqa: E402

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddlewareStack(
            URLRouter(
                assistance.routing.websocket_urlpatterns
            )
        )
    ),
})
