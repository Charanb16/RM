"""Assistance request, offer, and booking event audit models."""
from decimal import Decimal
from django.conf import settings
from django.contrib.gis.db import models as gis_models
from django.db import models
from core.utils import TimeStampedModel, coords_from_point
from .fsm import OfferStatus, RequestStatus


class AssistanceRequest(TimeStampedModel):
    """Emergency roadside assistance request created by a customer.

    Tracks location via PostGIS, assigned provider, dispatch radius,
    status transitions, and final financial reconciliation amounts.
    """

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assistance_requests',
        verbose_name='Customer',
        help_text='The user seeking roadside assistance.',
    )
    vehicle = models.ForeignKey(
        'vehicles.Vehicle',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assistance_requests',
        verbose_name='Breakdown Vehicle',
        help_text='Vehicle requiring assistance.',
    )
    service = models.ForeignKey(
        'services.Service',
        on_delete=models.PROTECT,
        related_name='assistance_requests',
        verbose_name='Requested Service',
        help_text='Type of assistance required (e.g. Towing, Battery Jumpstart).',
    )
    assigned_provider = models.ForeignKey(
        'providers.ProviderProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_requests',
        verbose_name='Assigned Service Provider',
        help_text='Provider accepted for this dispatch.',
    )
    location = gis_models.PointField(
        verbose_name='Breakdown GPS Coordinate',
        srid=4326,
        geography=True,
        help_text='PostGIS Point of customer breakdown site in WGS 84.',
    )
    address = models.CharField(
        verbose_name='Street Address / Landmark',
        max_length=255,
        blank=True,
        help_text='Human-readable address or landmark description.',
    )
    status = models.CharField(
        verbose_name='Request Status',
        max_length=30,
        choices=RequestStatus.choices,
        default=RequestStatus.DRAFT,
        db_index=True,
        help_text='Current state in the assistance lifecycle.',
    )
    description = models.TextField(
        verbose_name='Problem Description',
        blank=True,
        help_text='Customer description of symptoms or vehicle issue.',
    )
    quoted_amount = models.DecimalField(
        verbose_name='Quoted / Accepted Amount (INR)',
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Price agreed upon when offer was accepted.',
    )
    final_amount = models.DecimalField(
        verbose_name='Final Amount Charged (INR)',
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Final amount charged upon job completion, including any extra labor/parts.',
    )
    current_search_radius_km = models.PositiveIntegerField(
        verbose_name='Current Search Radius (KM)',
        default=3,
        help_text='Current search radius utilized during expanding dispatch.',
    )
    cancellation_reason = models.TextField(
        verbose_name='Cancellation Reason',
        blank=True,
        help_text='Explanation if cancelled by customer, provider, or timeout.',
    )
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_assistance_requests',
        verbose_name='Cancelled By User',
    )
    completed_at = models.DateTimeField(
        verbose_name='Completed At',
        null=True,
        blank=True,
        help_text='Timestamp when service was successfully completed.',
    )

    class Meta:
        verbose_name = 'Assistance Request'
        verbose_name_plural = 'Assistance Requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['assigned_provider', 'status']),
        ]

    def __str__(self):
        return f"Req #{self.id} - {self.service.name} [{self.get_status_display()}] by {self.customer.email}"

    @property
    def coordinates(self) -> dict:
        """Returns coordinate dictionary containing latitude and longitude."""
        return coords_from_point(self.location)


class AssistanceOffer(TimeStampedModel):
    """Offer dispatched by the matching engine to an eligible nearby provider."""

    request = models.ForeignKey(
        AssistanceRequest,
        on_delete=models.CASCADE,
        related_name='offers',
        verbose_name='Assistance Request',
    )
    provider = models.ForeignKey(
        'providers.ProviderProfile',
        on_delete=models.CASCADE,
        related_name='offers',
        verbose_name='Offered Provider',
    )
    quoted_amount = models.DecimalField(
        verbose_name='Offer Price (INR)',
        max_digits=10,
        decimal_places=2,
        help_text='Proposed cost for fulfilling this request.',
    )
    estimated_arrival_minutes = models.PositiveIntegerField(
        verbose_name='ETA (Minutes)',
        default=15,
        help_text='Estimated arrival time to customer location.',
    )
    status = models.CharField(
        verbose_name='Offer Status',
        max_length=20,
        choices=OfferStatus.choices,
        default=OfferStatus.PENDING,
        db_index=True,
    )
    expires_at = models.DateTimeField(
        verbose_name='Offer Expiration Timestamp',
        db_index=True,
        help_text='Timestamp after which offer expires automatically.',
    )
    response_notes = models.TextField(
        verbose_name='Provider Response Notes',
        blank=True,
        help_text='Notes provided if declining or responding.',
    )

    class Meta:
        verbose_name = 'Assistance Offer'
        verbose_name_plural = 'Assistance Offers'
        ordering = ['-created_at']
        unique_together = ('request', 'provider')
        indexes = [
            models.Index(fields=['status', 'expires_at']),
        ]

    def __str__(self):
        return f"Offer #{self.id} for Req #{self.request_id} -> {self.provider.business_name} ({self.get_status_display()})"


class BookingEvent(TimeStampedModel):
    """Audit log capturing every lifecycle state transition and milestone of a booking."""

    request = models.ForeignKey(
        AssistanceRequest,
        on_delete=models.CASCADE,
        related_name='events',
        verbose_name='Assistance Request',
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='booking_events_triggered',
        verbose_name='Triggering User',
    )
    from_status = models.CharField(
        verbose_name='From Status',
        max_length=30,
    )
    to_status = models.CharField(
        verbose_name='To Status',
        max_length=30,
    )
    event_type = models.CharField(
        verbose_name='Event Type Code',
        max_length=50,
        help_text='Categorical code e.g. "DISPATCH_STARTED", "OFFER_ACCEPTED", "ARRIVAL_CONFIRMED".',
    )
    note = models.TextField(
        verbose_name='Event Notes',
        blank=True,
    )
    metadata = models.JSONField(
        verbose_name='Event Payload Metadata',
        default=dict,
        blank=True,
    )

    class Meta:
        verbose_name = 'Booking Audit Event'
        verbose_name_plural = 'Booking Audit Events'
        ordering = ['created_at']

    def __str__(self):
        return f"Event on Req #{self.request_id}: {self.from_status} -> {self.to_status} ({self.event_type})"
