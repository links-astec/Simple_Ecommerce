from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from store.views import product_share

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('store.urls')),
    path('share/<slug:slug>/', product_share, name='product-share'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # Serve media files in production (Render)
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]

admin.site.site_header = "Bel's Haven Admin"
admin.site.site_title = "Bel's Haven"
admin.site.index_title = "Store Management"
