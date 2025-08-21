from django.contrib import admin
from .models import Project, Tag, Yarn, ProjectYarn, ProjectProgress, ProgressImage

class ProjectYarnInline(admin.TabularInline):
    model = ProjectYarn
    extra = 0
    autocomplete_fields = ("yarn",)
    fields = ("yarn", "quantity_used_skeins", "quantity_used_grams")

class ProjectProgressInline(admin.TabularInline):
    model = ProjectProgress
    extra = 0
    fields = ("date", "rows_completed", "stitches_completed", "notes")
    ordering = ("-date",)

class ProgressImageInline(admin.TabularInline):
    model = ProgressImage
    extra = 1
    fields = ("image", "preview")
    readonly_fields = ("preview",)

    def preview(self, obj):
        if not obj.pk or not obj.image:
            return "—"
        return f'<img src="{obj.image.url}" style="height:80px;border-radius:6px;" />'
    preview.allow_tags = True


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "type", "start_date", "expected_end_date")
    list_filter = ("type", "start_date", "expected_end_date", "tags")
    search_fields = ("name", "notes", "pattern_text")
    date_hierarchy = "start_date"
    autocomplete_fields = ("tags",)
    inlines = [ProjectYarnInline, ProjectProgressInline]

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

@admin.register(Yarn)
class YarnAdmin(admin.ModelAdmin):
    list_display = ("id", "brand", "colour_name", "colour", "weight", "material", "product_link")
    list_filter = ("weight", "material", "brand")
    search_fields = ("brand", "colour")

@admin.register(ProjectYarn)
class ProjectYarnAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "yarn", "quantity_used_skeins", "quantity_used_grams")
    list_filter = ("project", "yarn")
    search_fields = ("project__name", "yarn__brand", "yarn__colour")
    autocomplete_fields = ("project", "yarn")

@admin.register(ProjectProgress)
class ProjectProgressAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "date", "rows_completed", "stitches_completed")
    list_filter = ("project", "date")
    search_fields = ("project__name", "notes")
    date_hierarchy = "date"
    autocomplete_fields = ("project",)
    inlines = [ProgressImageInline]


