from typing import Any, Optional

class AppError(Exception):
    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred"
    details: Optional[Any] = None

    def __init__(self, message: Optional[str] = None, details: Optional[Any] = None):
        if message:
            self.message = message
        self.details = details
        super().__init__(self.message)

class NotFoundError(AppError):
    status_code = 404
    error_code = "NOT_FOUND"

class ForbiddenError(AppError):
    status_code = 403
    error_code = "FORBIDDEN"

class UnauthorizedError(AppError):
    status_code = 401
    error_code = "UNAUTHORIZED"

class ConflictError(AppError):
    status_code = 409
    error_code = "CONFLICT"

class RateLimitError(AppError):
    status_code = 429
    error_code = "RATE_LIMITED"

class ValidationError(AppError):
    status_code = 422
    error_code = "VALIDATION_ERROR"

class InferenceUnavailableError(AppError):
    status_code = 503
    error_code = "INFERENCE_UNAVAILABLE"
