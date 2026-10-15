"""Channels authentication middleware supporting JWT tokens in query parameters or headers."""
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def get_user_from_token(token_string):
    """Decode JWT access token and return the associated active User instance."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        token = AccessToken(token_string)
        user_id = token['user_id']
        return User.objects.get(id=user_id, is_active=True)
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """Middleware for Django Channels to authenticate WebSocket connections using JWT tokens.

    Supports:
    1. Query string: ws://.../?token=<jwt_access_token>
    2. Subprotocol or Authorization header: Bearer <jwt_access_token>
    """

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token = None

        if 'token' in query_params:
            token = query_params['token'][0]
        else:
            headers = dict(scope.get('headers', []))
            if b'authorization' in headers:
                auth_header = headers[b'authorization'].decode('utf-8')
                parts = auth_header.split()
                if len(parts) == 2 and parts[0].lower() == 'bearer':
                    token = parts[1]

        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """Helper wrapper for JWT WebSocket authentication."""
    return JWTAuthMiddleware(inner)
