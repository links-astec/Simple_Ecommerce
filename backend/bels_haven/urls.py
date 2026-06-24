from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse, Http404
from store.views import product_share
import os

def serve_media(request, path):
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    if not os.path.isfile(file_path):
        raise Http404
    response = FileResponse(open(file_path, 'rb'))
    response['Cache-Control'] = 'public, max-age=2592000'
    return response

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('store.urls')),
    path('share/<slug:slug>/', product_share, name='product-share'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve_media, name='serve-media'),
    ]

admin.site.site_header = "Bel's Haven Admin"
admin.site.site_title = "Bel's Haven"
admin.site.index_title = "Store Management"
