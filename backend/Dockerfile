FROM python:3.12-slim

WORKDIR /backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for insanely fast python dependency resolution & installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install Python dependencies
COPY pyproject.toml .
RUN uv pip install --system --no-cache .

# Copy application code
COPY . .

RUN adduser --disabled-password appuser \
    && chown -R appuser /backend

USER appuser

# Expose port
EXPOSE 8000

# Default command (overridden in compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
