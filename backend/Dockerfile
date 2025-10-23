# syntax=docker/dockerfile:1.7
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/

RUN useradd -m appuser \
 && mkdir -p /app/data /app/staticfiles \
 && chown -R appuser:appuser /app

USER appuser

# Optional: build-time collectstatic (set via ARG)
ARG COLLECTSTATIC=0
ENV COLLECTSTATIC=$COLLECTSTATIC
RUN if [ "$COLLECTSTATIC" = "1" ]; then python manage.py collectstatic --noinput; else echo "skip collectstatic"; fi

# Ensure the entrypoint is executable at copy time (no chmod needed later)
COPY --chmod=0755 backend/entrypoint.sh /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]

