from .base import *
import os
from pathlib import Path

DEBUG = False

ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h.strip()]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "stitchtracker"),
        "USER": os.getenv("DB_USER", "stitch"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "db"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

def env_bool(k: str, default: bool) -> bool:
    return os.getenv(k, str(default)).lower() in {"1", "true", "yes", "on"}

CSRF_TRUSTED_ORIGINS = [
    o.strip() for o in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()
] or [
    "http://localhost:8082",
    "http://127.0.0.1:8082",
]

ENABLE_HTTPS = env_bool("ENABLE_HTTPS", False)

CSRF_COOKIE_SECURE = ENABLE_HTTPS
SESSION_COOKIE_SECURE = ENABLE_HTTPS
CSRF_COOKIE_SAMESITE = os.getenv("CSRF_COOKIE_SAMESITE", "Lax")
SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly"
    ],
}

if "corsheaders" not in INSTALLED_APPS:
    INSTALLED_APPS += ["corsheaders"]
if "corsheaders.middleware.CorsMiddleware" not in MIDDLEWARE:
    MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware"] + MIDDLEWARE
CORS_ALLOW_ALL_ORIGINS = True

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {"django.server": {"handlers": ["console"], "level": "INFO", "propagate": False}},
}
