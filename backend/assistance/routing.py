"""WebSocket URL routing for assistance real-time tracking and provider alerts."""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/assistance/(?P<request_id>\d+)/tracking/$', consumers.AssistanceTrackingConsumer.as_asgi()),
    re_path(r'^ws/provider/notifications/$', consumers.ProviderNotificationConsumer.as_asgi()),
]
