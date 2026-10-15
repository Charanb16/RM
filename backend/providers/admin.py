"""Admin interface for ProviderProfile and ProviderService."""
from django.contrib.gis import admin
from .models import ProviderProfile, ProviderService


class ProviderServiceInline(admin.TabularInline):
    """Inline for managing services directly within ProviderProfile."""
    model = ProviderService
    extra = 1
    autocomplete_fields = ('service',)


@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.GISModelAdmin):
    """GIS Admin interface for managing service providers with OpenStreetMap widget."""
    list_display = (
        'business_name',
        'user_email',
        'verification_status',
        'is_online',
        'is_busy',
        'average_rating',
        'total_reviews',
        'service_radius_km',
        'last_location_update',
        'created_at',
    )
    list_filter = (
        'verification_status',
        'is_online',
        'is_busy',
        'created_at',
        'approved_at',
    )
    search_fields = (
        'business_name',
        'user__email',
        'user__full_name',
        'user__phone',
        'business_license_number',
    )
    ordering = ('-created_at',)
    readonly_fields = ('average_rating', 'total_reviews', 'created_at', 'updated_at')
    raw_id_fields = ('user', 'approved_by')
    inlines = [ProviderServiceInline]

    fieldsets = (
        ('Account & Identity', {
            'fields': ('user', 'business_name', 'business_license_number', 'id_document_url', 'bio')
        }),
        ('Verification & Status', {
            'fields': (
                'verification_status',
                'is_online',
                'is_busy',
                'approved_at',
                'approved_by',
            )
        }),
        ('Location & Coverage', {
            'fields': ('location', 'service_radius_km', 'last_location_update')
        }),
        ('Reputation Metrics', {
            'fields': ('average_rating', 'total_reviews')
        }),
        ('Audit Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'


@admin.register(ProviderService)
class ProviderServiceAdmin(admin.ModelAdmin):
    """Admin configuration for provider service offering junction records."""
    list_display = ('provider', 'service', 'custom_base_price', 'is_available', 'created_at')
    list_filter = ('is_available', 'service__category')
    search_fields = ('provider__business_name', 'service__name')
    raw_id_fields = ('provider', 'service')
