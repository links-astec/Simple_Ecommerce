from django.urls import path
from . import views
from .views import health
urlpatterns = [
    # Public
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category-detail'),
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/<slug:slug>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('stats/', views.store_stats, name='store-stats'),

    # Orders
    path('orders/', views.OrderCreateView.as_view(), name='order-create'),
    path('orders/all/', views.AdminOrderListView.as_view(), name='order-list-admin'),
    path('orders/<str:reference>/', views.OrderDetailView.as_view(), name='order-detail'),

    # Payment
    path('payment/initialize/', views.PaystackInitializeView.as_view(), name='payment-init'),
    path('payment/verify/', views.PaystackVerifyView.as_view(), name='payment-verify'),
    path('payment/webhook/', views.PaystackWebhookView.as_view(), name='payment-webhook'),

    # Admin – product images
    path('product-images/', views.ProductImageUploadView.as_view(), name='product-image-upload'),
    path("health/", health),

]
