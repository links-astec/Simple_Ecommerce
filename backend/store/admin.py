from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, ProductImage, Order, OrderItem, ShippingNotification


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'product_count']
    prepopulated_fields = {'slug': ('name',)}

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'


class ProductImageInline(admin.TabularInline):
    model = Product.images.through
    extra = 1
    verbose_name = 'Image'
    verbose_name_plural = 'Product Images'


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'image_preview', 'alt_text', 'is_primary']

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" height="50"/>', obj.image.url)
        return '-'
    image_preview.short_description = 'Preview'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'product_type', 'price', 'stock_quantity',
        'status', 'preorder_shipped', 'is_featured', 'created_at'
    ]
    list_filter = ['product_type', 'status', 'category', 'is_featured', 'preorder_shipped']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['status', 'is_featured', 'preorder_shipped', 'stock_quantity']
    filter_horizontal = ['images']

    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'slug', 'category', 'description', 'price', 'status', 'is_featured', 'images')
        }),
        ('Stock', {
            'fields': ('stock_quantity',)
        }),
        ('Product Type', {
            'fields': ('product_type',)
        }),
        ('Available Product Settings', {
            'fields': ('delivery_timeframe', 'shipping_fee'),
            'classes': ('collapse',),
            'description': 'Fill these for IN-STOCK items only',
        }),
        ('Pre-order Settings', {
            'fields': (
                'preorder_eta', 'preorder_available_date',
                'preorder_shipped', 'preorder_shipping_fee'
            ),
            'classes': ('collapse',),
            'description': 'Fill these for PRE-ORDER items only',
        }),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'product_type', 'quantity', 'unit_price', 'shipping_fee']
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'reference', 'customer_name', 'customer_email', 'status',
        'total_amount', 'payment_verified', 'created_at'
    ]
    list_filter = ['status', 'payment_verified', 'created_at']
    search_fields = ['reference', 'customer_name', 'customer_email']
    readonly_fields = [
        'reference', 'customer_email', 'total_amount', 'shipping_fee',
        'paystack_reference', 'payment_verified', 'payment_date', 'created_at', 'updated_at'
    ]
    inlines = [OrderItemInline]
    list_editable = ['status']

    fieldsets = (
        ('Order Info', {
            'fields': ('reference', 'status', 'notes')
        }),
        ('Customer', {
            'fields': ('customer_name', 'customer_email', 'customer_phone')
        }),
        ('Delivery', {
            'fields': ('delivery_address', 'city', 'state', 'country')
        }),
        ('Payment', {
            'fields': ('total_amount', 'shipping_fee', 'payment_verified', 'paystack_reference', 'payment_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
