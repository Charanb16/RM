"""Standard pagination class for RoadMate API endpoints."""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination supporting client-specified page sizing and page metadata.

    Query parameters:
        page: Integer page number (1-indexed, default: 1)
        page_size: Integer number of records per page (default: 20, max: 100)
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        """Wraps paginated items in a comprehensive envelope with navigation metadata."""
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
        })
