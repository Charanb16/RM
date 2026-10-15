"""Admin configuration for customer reviews."""
from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Admin representation for customer feedback and ratings."""
    list_display = (
        'id',
        'provider',
        'customer',
        'rating_stars',
        'is_public',
        'short_comment',
        'created_at',
    )
    list_filter = ('rating', 'is_public', 'created_at')
    search_fields = (
        'provider__business_name',
        'customer__email',
        'customer__full_name',
        'comment',
        'request__id',
    )
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('request', 'customer', 'provider')

    fieldsets = (
        ('Review Association', {
            'fields': ('request', 'customer', 'provider')
        }),
        ('Feedback & Rating', {
            'fields': ('rating', 'comment', 'is_public')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def rating_stars(self, obj):
        return f"{'★' * obj.rating}{'☆' * (5 - obj.rating)} ({obj.rating}/5)"
    rating_stars.short_description = 'Rating'

    def short_comment(self, obj):
        if not obj.comment:
            return '-'
        return obj.comment[:60] + ('...' if len(obj.comment) > 60 else '')
    short_comment.short_description = 'Comment'
