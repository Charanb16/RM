"""Shared utilities, geospatial helpers, base abstract models, and response helpers."""
import math
from decimal import Decimal
from django.contrib.gis.geos import Point
from django.db import models
from rest_framework import status
from rest_framework.response import Response


class TimeStampedModel(models.Model):
    """An abstract base model providing self-updating created_at and updated_at fields."""

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when the record was initially created.",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the record was last modified.",
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']


def point_from_coords(latitude: float, longitude: float) -> Point:
    """Create a GeoDjango Point object from latitude and longitude.

    Note: GeoDjango Point takes coordinates in (X, Y) order = (longitude, latitude).
    Spatial Reference System Identifier (SRID) 4326 represents standard WGS 84 GPS coordinates.

    Args:
        latitude: Latitude in degrees (-90.0 to 90.0)
        longitude: Longitude in degrees (-180.0 to 180.0)

    Returns:
        django.contrib.gis.geos.Point instance
    """
    if latitude is None or longitude is None:
        return None
    return Point(float(longitude), float(latitude), srid=4326)


def coords_from_point(point: Point) -> dict:
    """Extract latitude and longitude dictionary from a GeoDjango Point.

    Args:
        point: django.contrib.gis.geos.Point instance

    Returns:
        Dictionary with 'latitude' and 'longitude' float values, or None
    """
    if not point:
        return {'latitude': None, 'longitude': None}
    return {
        'latitude': round(point.y, 6),
        'longitude': round(point.x, 6),
    }


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth in kilometers.

    Args:
        lat1: Latitude of point 1
        lon1: Longitude of point 1
        lat2: Latitude of point 2
        lon2: Longitude of point 2

    Returns:
        Distance in kilometers (float)
    """
    r = 6371.0  # Earth's radius in kilometers
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)


def to_decimal(value, default="0.00") -> Decimal:
    """Safely convert any numeric value or string to a 2-decimal place Decimal."""
    if value is None:
        return Decimal(default)
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except Exception:
        return Decimal(default)


def api_success_response(data=None, message="Success", status_code=status.HTTP_200_OK, **kwargs):
    """Constructs a consistent success response dictionary."""
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }
    payload.update(kwargs)
    return Response(payload, status=status_code)
