"""Channels WebSocket consumers for real-time GPS tracking and dispatch notifications."""
import json
import logging
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone
from core.utils import point_from_coords

logger = logging.getLogger('roadmate.websockets')


class AssistanceTrackingConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time provider location tracking during active assistance jobs.

    Path: ws/assistance/<request_id>/tracking/
    Clients receive real-time GPS coordinates of the dispatched provider en route.
    """

    async def connect(self):
        self.request_id = self.scope['url_route']['kwargs']['request_id']
        self.group_name = f"assistance_{self.request_id}"
        user = self.scope.get('user')

        # Require authenticated connection
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return

        # Check authorization to participate in this tracking room
        is_allowed = await self.is_authorized_participant(user, self.request_id)
        if not is_allowed:
            await self.close(code=4403)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        logger.info("WebSocket connected to %s by user %s", self.group_name, user.email)

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            logger.info("WebSocket disconnected from %s (code %s)", self.group_name, close_code)

    async def receive(self, text_data):
        """Handle incoming messages from provider or customer."""
        try:
            data = json.loads(text_data)
        except Exception:
            await self.send(text_data=json.dumps({"error": "Invalid JSON format"}))
            return

        msg_type = data.get('type')
        user = self.scope.get('user')

        if msg_type == 'location_update':
            lat = data.get('latitude')
            lng = data.get('longitude')
            heading = data.get('heading', 0.0)
            speed = data.get('speed', 0.0)

            if lat is not None and lng is not None:
                # Update provider location in database asynchronously
                await self.save_provider_location(user, lat, lng)

                # Broadcast live position to all clients watching this request
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'tracking.location_broadcast',
                        'payload': {
                            'provider_id': user.id,
                            'latitude': lat,
                            'longitude': lng,
                            'heading': heading,
                            'speed': speed,
                            'timestamp': timezone.now().isoformat(),
                        },
                    },
                )

        elif msg_type == 'chat_message':
            text = data.get('text', '').strip()
            if text:
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'tracking.chat_broadcast',
                        'payload': {
                            'sender_id': user.id,
                            'sender_name': user.full_name,
                            'text': text,
                            'timestamp': timezone.now().isoformat(),
                        },
                    },
                )

    async def tracking_location_broadcast(self, event):
        """Handler for location broadcast events."""
        await self.send(text_data=json.dumps({
            'type': 'location_update',
            'data': event['payload'],
        }))

    async def tracking_chat_broadcast(self, event):
        """Handler for chat broadcast events."""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'data': event['payload'],
        }))

    @database_sync_to_async
    def is_authorized_participant(self, user, request_id):
        """Verify user is customer, assigned provider, or admin."""
        from .models import AssistanceRequest
        try:
            req = AssistanceRequest.objects.select_related('customer', 'assigned_provider__user').get(pk=request_id)
            if user.is_platform_admin:
                return True
            if req.customer == user:
                return True
            if req.assigned_provider and req.assigned_provider.user == user:
                return True
            return False
        except AssistanceRequest.DoesNotExist:
            return False

    @database_sync_to_async
    def save_provider_location(self, user, lat, lng):
        """Update provider profile's GPS point in DB."""
        if hasattr(user, 'provider_profile'):
            profile = user.provider_profile
            profile.location = point_from_coords(lat, lng)
            profile.last_location_update = timezone.now()
            profile.save(update_fields=['location', 'last_location_update', 'updated_at'])


class ProviderNotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for pushing real-time dispatched job alerts to a provider."""

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated or not user.is_provider:
            await self.close(code=4403)
            return

        provider_id = await self.get_provider_id(user)
        if not provider_id:
            await self.close(code=4404)
            return

        self.group_name = f"provider_{provider_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        logger.info("Provider notifications connected: %s", self.group_name)

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def provider_offer_dispatched(self, event):
        """Receive offer dispatch event and push alert to provider client."""
        await self.send(text_data=json.dumps({
            'type': 'new_offer',
            'data': event['payload'],
        }))

    @database_sync_to_async
    def get_provider_id(self, user):
        if hasattr(user, 'provider_profile'):
            return user.provider_profile.id
        return None
