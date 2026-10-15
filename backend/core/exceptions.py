"""Custom exception classes and global DRF exception handler.

Standardizes all API error responses to the canonical structure:
{
    "detail": "...",
    "code": "...",
    "field_errors": {
        "field_name": ["error description"]
    }
}
"""
import logging
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger('roadmate.errors')


class Conflict(exceptions.APIException):
    """Exception raised for resource conflicts (e.g. concurrency, expired offers). HTTP 409."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'A conflict occurred with the current state of the resource.'
    default_code = 'conflict'


class BadRequest(exceptions.APIException):
    """Exception raised for semantic or business rule validation errors. HTTP 400."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'The request could not be processed due to invalid parameters.'
    default_code = 'bad_request'


class Forbidden(exceptions.APIException):
    """Exception raised when an authenticated user lacks permissions. HTTP 403."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'forbidden'


class NotFound(exceptions.APIException):
    """Exception raised when a requested resource does not exist. HTTP 404."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'The requested resource was not found.'
    default_code = 'not_found'


class ServiceUnavailable(exceptions.APIException):
    """Exception raised when an external dependency is unreachable. HTTP 503."""
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'Service temporarily unavailable. Please retry shortly.'
    default_code = 'service_unavailable'


def custom_exception_handler(exc, context):
    """Global DRF exception handler that enforces a uniform error payload.

    Args:
        exc: Exception instance.
        context: Context dictionary containing view and request.

    Returns:
        Response instance with normalized JSON envelope.
    """
    # Translate Django core exceptions to DRF exceptions if needed
    if isinstance(exc, Http404):
        exc = exceptions.NotFound(detail=str(exc) or "The requested resource was not found.")
    elif isinstance(exc, DjangoValidationError):
        if hasattr(exc, 'message_dict'):
            exc = exceptions.ValidationError(detail=exc.message_dict)
        elif hasattr(exc, 'messages'):
            exc = exceptions.ValidationError(detail=exc.messages)
        else:
            exc = exceptions.ValidationError(detail=str(exc))

    response = exception_handler(exc, context)

    # If DRF doesn't handle it, it's an unhandled server exception (500)
    if response is None:
        logger.exception("Unhandled application exception: %s", str(exc), exc_info=exc)
        return Response(
            {
                "detail": "An internal server error occurred. Please contact support.",
                "code": "internal_server_error",
                "field_errors": {},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Process structured error details
    detail_msg = "An error occurred while processing your request."
    code = getattr(exc, 'default_code', 'error')
    field_errors = {}

    data = response.data

    if isinstance(data, dict):
        if 'detail' in data:
            detail_msg = str(data['detail'])
            if hasattr(data['detail'], 'code'):
                code = data['detail'].code
        else:
            # Field-level validation errors
            detail_msg = "Invalid input data provided."
            code = "validation_error"
            for field, messages in data.items():
                if isinstance(messages, list):
                    field_errors[field] = [str(m) for m in messages]
                elif isinstance(messages, dict):
                    field_errors[field] = messages
                else:
                    field_errors[field] = [str(messages)]
    elif isinstance(data, list):
        detail_msg = str(data[0]) if data else detail_msg
        code = "validation_error"
        field_errors["non_field_errors"] = [str(item) for item in data]
    elif isinstance(data, str):
        detail_msg = data

    normalized_response_data = {
        "detail": detail_msg,
        "code": str(code),
        "field_errors": field_errors,
    }

    response.data = normalized_response_data
    return response
