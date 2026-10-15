"""Finite State Machine (FSM) defining lifecycle states and legal transitions for assistance requests."""
from django.db import models
from core.exceptions import BadRequest, Conflict


class RequestStatus(models.TextChoices):
    """Lifecycle statuses of an assistance request."""
    DRAFT = 'draft', 'Draft'
    REQUESTED = 'requested', 'Requested (Pending Dispatch)'
    OFFERED = 'offered', 'Offered to Nearby Providers'
    ACCEPTED = 'accepted', 'Offer Accepted / Provider Assigned'
    EN_ROUTE = 'en_route', 'Provider En Route'
    ARRIVED = 'arrived', 'Provider Arrived on Scene'
    IN_PROGRESS = 'in_progress', 'Assistance In Progress'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'
    NO_PROVIDERS_FOUND = 'no_providers_found', 'No Providers Found'


class OfferStatus(models.TextChoices):
    """Lifecycle statuses of an assistance offer dispatched to a provider."""
    PENDING = 'pending', 'Pending Provider Response'
    ACCEPTED = 'accepted', 'Accepted by Customer'
    REJECTED = 'rejected', 'Declined by Provider'
    EXPIRED = 'expired', 'Expired'
    WITHDRAWN = 'withdrawn', 'Withdrawn by System'


# Graph of allowed state transitions
ALLOWED_TRANSITIONS = {
    RequestStatus.DRAFT: [
        RequestStatus.REQUESTED,
        RequestStatus.CANCELLED,
    ],
    RequestStatus.REQUESTED: [
        RequestStatus.OFFERED,
        RequestStatus.NO_PROVIDERS_FOUND,
        RequestStatus.CANCELLED,
    ],
    RequestStatus.OFFERED: [
        RequestStatus.ACCEPTED,
        RequestStatus.REQUESTED,  # Expansion/retry
        RequestStatus.NO_PROVIDERS_FOUND,
        RequestStatus.CANCELLED,
    ],
    RequestStatus.NO_PROVIDERS_FOUND: [
        RequestStatus.REQUESTED,  # Manual retry
        RequestStatus.CANCELLED,
    ],
    RequestStatus.ACCEPTED: [
        RequestStatus.EN_ROUTE,
        RequestStatus.CANCELLED,
    ],
    RequestStatus.EN_ROUTE: [
        RequestStatus.ARRIVED,
        RequestStatus.CANCELLED,
    ],
    RequestStatus.ARRIVED: [
        RequestStatus.IN_PROGRESS,
        RequestStatus.CANCELLED,
    ],
    RequestStatus.IN_PROGRESS: [
        RequestStatus.COMPLETED,
        RequestStatus.CANCELLED,
    ],
    RequestStatus.COMPLETED: [],  # Terminal
    RequestStatus.CANCELLED: [],  # Terminal
}


def can_transition(current_status: str, target_status: str) -> bool:
    """Check if transitioning from current_status to target_status is valid."""
    allowed = ALLOWED_TRANSITIONS.get(current_status, [])
    return target_status in allowed


def validate_transition(current_status: str, target_status: str):
    """Enforces transition legality, raising appropriate DRF exception if invalid."""
    if not can_transition(current_status, target_status):
        raise Conflict(
            f"Cannot transition assistance request from '{current_status}' to '{target_status}'."
        )


def record_booking_event(request_obj, actor, from_status: str, to_status: str, event_type: str, note: str = "", metadata: dict = None):
    """Helper to record an immutable audit event for a status change or booking milestone."""
    from .models import BookingEvent
    return BookingEvent.objects.create(
        request=request_obj,
        actor=actor,
        from_status=from_status,
        to_status=to_status,
        event_type=event_type,
        note=note,
        metadata=metadata or {},
    )
