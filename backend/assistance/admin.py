"""Admin configuration for AssistanceRequest, AssistanceOffer, and BookingEvent."""
from django.contrib.gis import admin
from .models import AssistanceOffer, AssistanceRequest, BookingEvent


class AssistanceOfferInline(admin.TabularInline):
    """Inline view of offers dispatched for an assistance request."""
    model = AssistanceOffer
    extra = 0
    readonly_fields = ('provider', 'quoted_amount', 'estimated_arrival_minutes', 'status', 'expires_at', 'created_at')
    can_delete = False


class BookingEventInline(admin.TabularInline):
    """Inline view of timeline audit events."""
    model = BookingEvent
    extra = 0
    readonly_fields = ('actor', 'from_status', 'to_status', 'event_type', 'note', 'created_at')
    can_delete = False


@admin.register(AssistanceRequest)
class AssistanceRequestAdmin(admin.GISModelAdmin):
    """GIS Admin interface for customer assistance requests."""
    list_display = (
        'id',
        'customer_email',
        'service_name',
        'status',
        'assigned_provider_name',
        'quoted_amount',
        'final_amount',
        'current_search_radius_km',
        'created_at',
    )
    list_filter = ('status', 'service__category', 'created_at')
    search_fields = (
        'customer__email',
        'customer__full_name',
        'assigned_provider__business_name',
        'address',
        'description',
    )
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'completed_at')
    raw_id_fields = ('customer', 'vehicle', 'assigned_provider', 'cancelled_by')
    inlines = [AssistanceOfferInline, BookingEventInline]

    fieldsets = (
        ('Request Basics', {
            'fields': ('customer', 'service', 'vehicle', 'status', 'description')
        }),
        ('Location Data', {
            'fields': ('location', 'address', 'current_search_radius_km')
        }),
        ('Assignment & Financials', {
            'fields': ('assigned_provider', 'quoted_amount', 'final_amount', 'completed_at')
        }),
        ('Cancellation Details', {
            'fields': ('cancellation_reason', 'cancelled_by'),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def customer_email(self, obj):
        return obj.customer.email
    customer_email.short_description = 'Customer'

    def service_name(self, obj):
        return obj.service.name
    service_name.short_description = 'Service'

    def assigned_provider_name(self, obj):
        return obj.assigned_provider.business_name if obj.assigned_provider else '-'
    assigned_provider_name.short_description = 'Assigned Provider'


@admin.register(AssistanceOffer)
class AssistanceOfferAdmin(admin.ModelAdmin):
    """Admin interface for dispatched provider offers."""
    list_display = (
        'id',
        'request_id_display',
        'provider',
        'quoted_amount',
        'estimated_arrival_minutes',
        'status',
        'expires_at',
        'created_at',
    )
    list_filter = ('status', 'created_at')
    search_fields = ('provider__business_name', 'provider__user__email', 'request__id')
    raw_id_fields = ('request', 'provider')
    readonly_fields = ('created_at', 'updated_at')

    def request_id_display(self, obj):
        return f"Req #{obj.request_id}"
    request_id_display.short_description = 'Request'


@admin.register(BookingEvent)
class BookingEventAdmin(admin.ModelAdmin):
    """Admin interface for audit log events."""
    list_display = ('id', 'request_id_display', 'actor', 'from_status', 'to_status', 'event_type', 'created_at')
    list_filter = ('event_type', 'to_status', 'created_at')
    search_fields = ('request__id', 'actor__email', 'event_type', 'note')
    readonly_fields = ('request', 'actor', 'from_status', 'to_status', 'event_type', 'note', 'metadata', 'created_at', 'updated_at')

    def request_id_display(self, obj):
        return f"Req #{obj.request_id}"
    request_id_display.short_description = 'Request'
