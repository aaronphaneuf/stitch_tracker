from .base import *
DEBUG = False
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
CSRF_TRUSTED_ORIGINS = os.getenv("CSRF_TRUSTED_ORIGINS","").split(",") if os.getenv("CSRF_TRUSTED_ORIGINS") else []

