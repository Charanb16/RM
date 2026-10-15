"""Expanding radius dispatch engine for roadside assistance requests.

Implements iterative spatial proximity search across radii steps (3km -> 5km -> 8km -> 10km)
and dispatches offers to eligible nearby providers.
"""
from datetime import timedelta
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.contrib.gis.measure import D
from django.db import transaction
from django.utils import timezone

from providers.models import ProviderProfile, ProviderService, VerificationStatus
from .fsm import OfferStatus, RequestStatus, record_booking_event
from .models import AssistanceOffer, AssistanceRequest

logger = logging.getLogger('roadmate.dispatch')

RADIUS_STEPS = getattr(settings, 'DISPATCH_RADIUS_STEPS', [3, 5, 8, 10])  # in km
OFFER_EXPIRY_MINUTES = getattr(settings, 'DISPATCH_OFFER_EXPIRY_MINUTES', 10)


def notify_provider_offer(provider_profile_id: int, offer_id: int, request_id: int, service_name: str, distance_km: float):
    """Notify a provider over WebSocket that a new job offer is available."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"provider_{provider_profile_id}"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "provider.offer_dispatched",
                    "payload": {
                        "offer_id": offer_id,
                        "request_id": request_id,
                        "service_name": service_name,
                        "distance_km": distance_km,
                        "dispatched_at": timezone.now().isoformat(),
                    },
                },
            )
    except Exception as exc:
        logger.warning("Could not dispatch WebSocket notification to provider #%s: %s", provider_profile_id, exc)


@transaction.atomic
def find_and_dispatch(request: AssistanceRequest) -> bool:
    """Search for eligible nearby providers and create offers.

    Expands radius incrementally: 3km -> 5km -> 8km -> 10km.
    Returns True if offers were created, False if no providers found.

    Args:
        request: AssistanceRequest instance to match and dispatch.

    Returns:
        bool: True if at least one eligible provider received an offer; False otherwise.
    """
    logger.info("Starting dispatch engine for Request #%s (Service: %s)", request.id, request.service.name)

    expiry = timezone.now() + timedelta(minutes=OFFER_EXPIRY_MINUTES)
    offers_to_create = []
    providers_matched = []

    for radius in RADIUS_STEPS:
        request.current_search_radius_km = radius

        providers = ProviderProfile.objects.filter(
            verification_status=VerificationStatus.APPROVED,
            is_online=True,
            is_busy=False,
            services=request.service,
            location__distance_lte=(request.location, D(km=radius)),
        ).exclude(
            offers__request=request  # Don't re-offer to already-offered providers
        )

        if providers.exists():
            for p in providers:
                # Resolve provider pricing override if available
                ps = ProviderService.objects.filter(provider=p, service=request.service).first()
                price = ps.custom_base_price if (ps and ps.custom_base_price) else request.service.base_price

                offer = AssistanceOffer(
                    request=request,
                    provider=p,
                    quoted_amount=price,
                    estimated_arrival_minutes=max(10, int(radius * 3)),
                    status=OfferStatus.PENDING,
                    expires_at=expiry,
                )
                offers_to_create.append(offer)
                providers_matched.append((p, radius))

            # Providers found at this radial step; persist and break
            break

    if offers_to_create:
        created_offers = AssistanceOffer.objects.bulk_create(offers_to_create)
        old_status = request.status
        request.status = RequestStatus.OFFERED
        request.save(update_fields=['status', 'current_search_radius_km', 'updated_at'])

        record_booking_event(
            request_obj=request,
            actor=None,
            from_status=old_status,
            to_status=RequestStatus.OFFERED,
            event_type="DISPATCH_OFFERS_SENT",
            note=f"Dispatched {len(created_offers)} offers at radius {request.current_search_radius_km}km.",
            metadata={"offer_count": len(created_offers), "radius_km": request.current_search_radius_km},
        )

        # Send real-time alerts to each matched provider
        for offer, (p, r) in zip(created_offers, providers_matched):
            notify_provider_offer(
                provider_profile_id=p.id,
                offer_id=offer.id,
                request_id=request.id,
                service_name=request.service.name,
                distance_km=float(r),
            )

        logger.info(
            "Dispatched %s offers for Request #%s within %skm.",
            len(created_offers),
            request.id,
            request.current_search_radius_km,
        )
        return True

    # No eligible providers found in any radius step
    old_status = request.status
    request.status = RequestStatus.NO_PROVIDERS_FOUND
    request.save(update_fields=['status', 'current_search_radius_km', 'updated_at'])

    record_booking_event(
        request_obj=request,
        actor=None,
        from_status=old_status,
        to_status=RequestStatus.NO_PROVIDERS_FOUND,
        event_type="DISPATCH_EXHAUSTED",
        note=f"No online providers available within maximum radius of {RADIUS_STEPS[-1]}km.",
    )

    logger.warning("No providers found for Request #%s across all search radii.", request.id)
    return False
