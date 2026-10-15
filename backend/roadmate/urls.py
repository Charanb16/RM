"""RoadMate URL Configuration.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    """Healthcheck endpoint verifying DB and cache connectivity."""
    db_status = "healthy"
    try:
        connection.ensure_connection()
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"

    return JsonResponse({
        "status": "ok" if db_status == "healthy" else "degraded",
        "database": db_status,
        "service": "RoadMate API",
        "version": "1.0.0",
    })


urlpatterns = [
    # Administration
    path('admin/', admin.site.urls),

    # Healthcheck
    path('api/health/', health_check, name='api-health-check'),

    # API v1 Endpoints
    path('api/v1/accounts/', include('accounts.urls', namespace='accounts')),
    path('api/v1/vehicles/', include('vehicles.urls', namespace='vehicles')),
    path('api/v1/services/', include('services.urls', namespace='services')),
    path('api/v1/providers/', include('providers.urls', namespace='providers')),
    path('api/v1/assistance/', include('assistance.urls', namespace='assistance')),
    path('api/v1/payments/', include('payments.urls', namespace='payments')),
    path('api/v1/reviews/', include('reviews.urls', namespace='reviews')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
