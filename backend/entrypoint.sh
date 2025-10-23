#!/usr/bin/env bash
set -e

mkdir -p /app/media /app/staticfiles
chown -R appuser:appuser /app/media /app/staticfiles || true

python manage.py migrate --noinput

python manage.py collectstatic --noinput

exec gunicorn stitchtracker_backend.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --log-file -

