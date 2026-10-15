"""Review model for rating completed assistance requests and updating provider reputations."""
from decimal import Decimal
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from core.utils import TimeStampedModel


class Review(TimeStampedModel):
    """Customer review and numeric rating submitted for a completed assistance request.

    Updates the associated ProviderProfile cached average_rating and total_reviews.
    """

    request = models.OneToOneField(
        'assistance.AssistanceRequest',
        on_delete=models.CASCADE,
        related_name='review',
        verbose_name='Assistance Request',
        help_text='Completed assistance request being reviewed.',
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_written',
        verbose_name='Customer Reviewer',
    )
    provider = models.ForeignKey(
        'providers.ProviderProfile',
        on_delete=models.CASCADE,
        related_name='reviews_received',
        verbose_name='Reviewed Provider',
    )
    rating = models.PositiveSmallIntegerField(
        verbose_name='Star Rating (1-5)',
        validators=[
            MinValueValidator(1, message="Rating must be at least 1 star."),
            MaxValueValidator(5, message="Rating cannot exceed 5 stars."),
        ],
        help_text='Rating score from 1 (poor) to 5 (excellent).',
    )
    comment = models.TextField(
        verbose_name='Written Feedback',
        blank=True,
        help_text='Customer written review comment.',
    )
    is_public = models.BooleanField(
        verbose_name='Visible Publicly',
        default=True,
        help_text='Whether this review is visible in the provider public profile.',
    )

    class Meta:
        verbose_name = 'Customer Review'
        verbose_name_plural = 'Customer Reviews'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['provider', 'is_public', 'rating']),
        ]

    def __str__(self):
        return f"{self.rating}★ Review by {self.customer.email} for {self.provider.business_name}"

    def update_provider_statistics(self):
        """Recalculate and persist average rating and review counts on the provider profile."""
        stats = Review.objects.filter(provider=self.provider, is_public=True).aggregate(
            avg_rating=models.Avg('rating'),
            total_count=models.Count('id'),
        )
        avg = stats['avg_rating']
        self.provider.average_rating = Decimal(str(round(avg, 2))) if avg is not None else Decimal('0.00')
        self.provider.total_reviews = stats['total_count'] or 0
        self.provider.save(update_fields=['average_rating', 'total_reviews', 'updated_at'])

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.update_provider_statistics()

    def delete(self, *args, **kwargs):
        provider = self.provider
        super().delete(*args, **kwargs)
        # Recalculate after deletion
        stats = Review.objects.filter(provider=provider, is_public=True).aggregate(
            avg_rating=models.Avg('rating'),
            total_count=models.Count('id'),
        )
        avg = stats['avg_rating']
        provider.average_rating = Decimal(str(round(avg, 2))) if avg is not None else Decimal('0.00')
        provider.total_reviews = stats['total_count'] or 0
        provider.save(update_fields=['average_rating', 'total_reviews', 'updated_at'])
