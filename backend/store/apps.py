from django.apps import AppConfig


class StoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'store'
    verbose_name = "Bel's Haven Store"

    def ready(self):
        from .signals import connect_signals
        connect_signals()
