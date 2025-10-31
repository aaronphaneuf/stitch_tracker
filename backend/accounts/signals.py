from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.db import transaction
from django.dispatch import receiver

User = get_user_model()

@receiver(post_save, sender=User)
def promote_first_user_to_superuser(sender, instance, created, **kwargs):
    if not created:
        return

    def _promote_if_first():
        if sender.objects.filter(is_superuser=True).exists():
            return

        first = sender.objects.order_by("date_joined", "pk").first()
        if first and not first.is_superuser:
            sender.objects.filter(pk=first.pk).update(is_superuser=True, is_staff=True)

    transaction.on_commit(_promote_if_first)
