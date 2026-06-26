from django.db import models
from rest_framework import serializers
from .models import Category, Product, ProductImage, Order, OrderItem, SiteSettings


def _cloudinary_transform(url, width=None, quality='auto', fmt='auto'):
    if not url or 'res.cloudinary.com' not in url:
        return url
    if '/upload/' in url:
        transforms = f'w_{width},' if width else ''
        transforms += f'q_{quality},f_{fmt}'
        return url.replace('/upload/', f'/upload/{transforms}/')
    return url


def _absolute_image_url(request, url, width=None):
    if url and url.startswith('http'):
        return _cloudinary_transform(url, width=width)
    if request:
        return request.build_absolute_uri(url)
    return url


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary']


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'product_count']

    def get_product_count(self, obj):
        if hasattr(obj, '_product_count'):
            return obj._product_count
        return obj.products.filter(status='active', parent__isnull=True).count()


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    variant_count = serializers.SerializerMethodField()
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), allow_null=True, required=False
    )
    parent = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), allow_null=True, required=False
    )

    total_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'shipping_fee',
            'product_type', 'status', 'stock_quantity', 'delivery_timeframe',
            'preorder_eta', 'preorder_available_date', 'preorder_shipped',
            'preorder_shipping_fee', 'is_featured', 'category', 'category_name',
            'primary_image', 'variant_label', 'variant_count', 'parent', 'total_stock',
        ]

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first() or obj.images.first()
        if primary:
            return _absolute_image_url(self.context.get('request'), primary.image.url, width=400)
        if obj.parent is None:
            first_variant = obj.variants.filter(status='active').first()
            if first_variant:
                v_img = first_variant.images.filter(is_primary=True).first() or first_variant.images.first()
                if v_img:
                    return _absolute_image_url(self.context.get('request'), v_img.image.url, width=400)
        return None

    def get_variant_count(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'variants' in obj._prefetched_objects_cache:
            return len([v for v in obj.variants.all() if v.status == 'active'])
        return obj.variants.filter(status='active').count()

    def get_total_stock(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'variants' in obj._prefetched_objects_cache:
            active_variants = [v for v in obj.variants.all() if v.status == 'active']
            if active_variants:
                return sum(v.stock_quantity for v in active_variants)
        else:
            variant_stock = obj.variants.filter(status='active').aggregate(total=models.Sum('stock_quantity'))['total']
            if variant_stock is not None:
                return variant_stock
        return obj.stock_quantity


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images_list = serializers.SerializerMethodField()
    variants = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'shipping_fee',
            'product_type', 'status', 'stock_quantity', 'delivery_timeframe',
            'preorder_eta', 'preorder_available_date', 'preorder_shipped',
            'preorder_shipping_fee', 'is_featured', 'category', 'images_list',
            'created_at', 'variant_label', 'parent', 'variants',
        ]

    def _build_image_list(self, obj, width=800):
        request = self.context.get('request')
        images = []
        for img in obj.images.all():
            url = _absolute_image_url(request, img.image.url, width=width)
            images.append({'id': img.id, 'url': url, 'alt_text': img.alt_text, 'is_primary': img.is_primary})
        return images

    def get_images_list(self, obj):
        return self._build_image_list(obj)

    def get_variants(self, obj):
        if obj.parent is not None:
            return []
        request = self.context.get('request')
        variant_qs = obj.variants.filter(status='active').prefetch_related('images')
        result = []
        for v in variant_qs:
            primary_img = v.images.filter(is_primary=True).first() or v.images.first()
            img_url = _absolute_image_url(request, primary_img.image.url, width=400) if primary_img else None
            result.append({
                'id': str(v.id),
                'slug': v.slug,
                'variant_label': v.variant_label,
                'price': str(v.price),
                'shipping_fee': str(v.shipping_fee),
                'stock_quantity': v.stock_quantity,
                'primary_image': img_url,
                'images': self._build_image_list(v, width=800),
                'product_type': v.product_type,
                'preorder_eta': v.preorder_eta,
                'preorder_shipping_fee': str(v.preorder_shipping_fee),
                'delivery_timeframe': v.delivery_timeframe,
            })
        return result


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_type', 'quantity', 'unit_price', 'shipping_fee']


class OrderCreateSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.DictField(), write_only=True)

    class Meta:
        model = Order
        fields = [
            'customer_name', 'customer_email', 'customer_phone',
            'delivery_address', 'city', 'state', 'country', 'items', 'notes'
        ]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("At least one item is required.")
        return items

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        item_objects = []
        total = 0
        total_shipping = 0
        for item_data in items_data:
            try:
                product = Product.objects.get(id=item_data['product_id'])
            except (Product.DoesNotExist, Exception):
                raise serializers.ValidationError(
                    f"Product '{item_data.get('product_id')}' not found."
                )
            qty = int(item_data.get('quantity', 1))
            shipping = float(product.shipping_fee) if product.product_type == 'available' else 0
            total += float(product.price) * qty
            total_shipping += shipping * qty
            item_objects.append((product, qty, shipping))
        order = Order.objects.create(
            **validated_data,
            total_amount=total + total_shipping,
            shipping_fee=total_shipping,
        )
        for product, qty, shipping in item_objects:
            display_name = product.name
            if product.variant_label:
                display_name = f"{product.name} ({product.variant_label})"
            OrderItem.objects.create(
                order=order, product=product, product_name=display_name,
                product_type=product.product_type, quantity=qty,
                unit_price=product.price, shipping_fee=shipping,
            )
        return order


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'reference', 'customer_name', 'customer_email', 'customer_phone',
            'delivery_address', 'city', 'state', 'country', 'status', 'total_amount',
            'shipping_fee', 'payment_verified', 'payment_date', 'items', 'notes', 'created_at',
        ]
