from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static


def health_check(request):
    return JsonResponse(
        {
            "status": "healthy",
            "environment": settings.ENVIRONMENT,
            "version": settings.VERSION,
        }
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("health/", health_check, name="health_check"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
