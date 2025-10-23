from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'


class AccountsConfig(AppConfig):
    name = "accounts"

    def ready(self):
        # Import signals on app load
        from . import signals  # noqa
