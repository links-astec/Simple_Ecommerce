from rest_framework import serializers
from .models import Category, Product, ProductImage, Order, OrderItem


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
        return obj.products.filter(status='active').count()


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    # Allow writing category by id
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'shipping_fee',
            'product_type', 'status', 'stock_quantity', 'delivery_timeframe',
            'preorder_eta', 'preorder_available_date', 'preorder_shipped',
            'preorder_shipping_fee', 'is_featured', 'category', 'category_name',
            'primary_image',
        ]

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first() or obj.images.first()
        if primary:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary.image.url)
            return primary.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images_list = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'shipping_fee',
            'product_type', 'status', 'stock_quantity', 'delivery_timeframe',
            'preorder_eta', 'preorder_available_date', 'preorder_shipped',
            'preorder_shipping_fee', 'is_featured', 'category', 'images_list', 'created_at',
        ]

    def get_images_list(self, obj):
        request = self.context.get('request')
        images = []
        for img in obj.images.all():
            url = img.image.url
            if request:
                url = request.build_absolute_uri(url)
            images.append({'id': img.id, 'url': url, 'alt_text': img.alt_text, 'is_primary': img.is_primary})
        return images


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
        order = Order.objects.create(**validated_data)
        total = 0
        total_shipping = 0
        for item_data in items_data:
            product = Product.objects.get(id=item_data['product_id'])
            qty = int(item_data.get('quantity', 1))
            shipping = float(product.shipping_fee) if product.product_type == 'available' else 0
            subtotal = float(product.price) * qty
            OrderItem.objects.create(
                order=order, product=product, product_name=product.name,
                product_type=product.product_type, quantity=qty,
                unit_price=product.price, shipping_fee=shipping,
            )
            total += subtotal
            total_shipping += shipping * qty
        order.total_amount = total + total_shipping
        order.shipping_fee = total_shipping
        order.save()
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
