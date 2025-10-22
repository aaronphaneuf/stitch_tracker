from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone

class Tag(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tags",
        null=False,
    )
    name = models.CharField(max_length=64)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"], name="uniq_tag_name_per_user"
            ),
        ]

    def __str__(self):
        return self.name


class Yarn(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="yarns",
        null=False,
    )
    weight = models.CharField(max_length=50)
    brand = models.CharField(max_length=100)

    colour_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Colour printed on the label, e.g. 'Sky Blue'",
    )

    colour = models.CharField(
        max_length=7,
        validators=[
            RegexValidator(
                regex=r"^#(?:[0-9a-fA-F]{3}){1,2}$",
                message="Colour must be a valid hex code (e.g., #A1B2C3)",
            )
        ],
        help_text="Enter a hex colour code, e.g. #AABBCC",
    )

    amount_per_skein = models.CharField(max_length=50)
    product_link = models.URLField(blank=True)
    material = models.CharField(
        max_length=100,
        blank=True,
        help_text="Fiber content, e.g. Wool, Cotton, Acrylic, etc.",
    )

    quantity_owned_skeins = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="How many skeins of this yarn you own (optional)",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "user",
                    "brand",
                    "weight",
                    "colour",
                    "material",
                    "amount_per_skein",
                ],
                name="uniq_yarn_signature_per_user",
            ),
        ]

    def __str__(self):
        return f"{self.brand} - {self.colour} ({self.weight})"


class Project(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
        null=False,
    )

    KNIT_CHOICES = [
        ("knit", "Knitting"),
        ("crochet", "Crochet"),
    ]

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=KNIT_CHOICES)

    tags = models.ManyToManyField(Tag, blank=True)

    start_date = models.DateField()
    expected_end_date = models.DateField(null=True, blank=True)
    needle_or_hook_size = models.CharField(max_length=50, blank=True)
    pattern_link = models.URLField(blank=True)
    pattern_text = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    main_image = models.ImageField(upload_to="projects/main/", null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"], name="uniq_project_name_per_user"
            ),
        ]

    def __str__(self):
        return self.name


class ProjectProgress(models.Model):
    project = models.ForeignKey(
        Project, related_name="progress_updates", on_delete=models.CASCADE
    )
    date = models.DateTimeField(default=timezone.now)
    rows_completed = models.PositiveIntegerField()
    stitches_completed = models.PositiveIntegerField()
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.project.name} - {self.rows_completed} rows on {self.date.date()}"


class ProgressImage(models.Model):
    progress = models.ForeignKey(
        ProjectProgress, related_name="images", on_delete=models.CASCADE
    )
    #image = models.ImageField(upload_to="projects/progress/")
    image = models.ImageField(upload_to="progress/")
    caption = models.CharField(max_length=200, blank=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.progress_id}"



class ProjectYarn(models.Model):
    project = models.ForeignKey(
        Project, related_name="yarns", on_delete=models.CASCADE
    )
    yarn = models.ForeignKey(
        Yarn, related_name="project_usages", on_delete=models.CASCADE
    )
    quantity_used_skeins = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    quantity_used_grams = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "yarn"], name="uniq_project_yarn_pair"
            ),
        ]

    def __str__(self):
        used = self.quantity_used_grams or self.quantity_used_skeins or "?"
        return f"{self.project.name} used {used} of {self.yarn}"

