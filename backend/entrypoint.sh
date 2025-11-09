#!/usr/bin/env bash
set -e

mkdir -p \
  /app/media \
  /app/media/progress \
  /app/media/projects \
  /app/media/projects/main \
  /app/staticfiles

chown -R 1000:1000 /app/media /app/staticfiles || true
chmod -R u+rwX /app/media /app/staticfiles || true

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn stitchtracker_backend.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --log-file -

