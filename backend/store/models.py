from django.db import models
from django.utils import timezone
import uuid


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    TYPE_AVAILABLE = 'available'
    TYPE_PREORDER = 'preorder'
    TYPE_CHOICES = [
        (TYPE_AVAILABLE, 'Available (In Stock)'),
        (TYPE_PREORDER, 'Pre-order'),
    ]

    STATUS_ACTIVE = 'active'
    STATUS_INACTIVE = 'inactive'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_INACTIVE, 'Inactive'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    product_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_AVAILABLE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    stock_quantity = models.PositiveIntegerField(default=0)
    images = models.ManyToManyField('ProductImage', blank=True, related_name='products')

    # Available product specific
    delivery_timeframe = models.CharField(max_length=100, blank=True, help_text="e.g. '3-5 business days'")

    # Preorder specific
    preorder_eta = models.CharField(max_length=100, blank=True, help_text="e.g. '4-6 weeks'")
    preorder_available_date = models.DateField(null=True, blank=True)
    preorder_shipped = models.BooleanField(default=False, help_text="Mark when preorder items are ready to ship")
    preorder_shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Shipping fee when preorder becomes available")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_featured = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def is_available(self):
        return self.product_type == self.TYPE_AVAILABLE and self.stock_quantity > 0 and self.status == self.STATUS_ACTIVE

    @property
    def is_preorder(self):
        return self.product_type == self.TYPE_PREORDER and self.status == self.STATUS_ACTIVE


class ProductImage(models.Model):
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image {self.id}"


class Order(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_PAID = 'paid'
    STATUS_PROCESSING = 'processing'
    STATUS_SHIPPED = 'shipped'
    STATUS_DELIVERED = 'delivered'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending Payment'),
        (STATUS_PAID, 'Paid'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_SHIPPED, 'Shipped'),
        (STATUS_DELIVERED, 'Delivered'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=100, unique=True)
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    delivery_address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='Ghana')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    paystack_reference = models.CharField(max_length=200, blank=True)
    payment_verified = models.BooleanField(default=False)
    payment_date = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.reference} - {self.customer_name}"

    def generate_reference(self):
        import secrets, string
        chars = string.ascii_uppercase + string.digits
        return 'BH' + ''.join(secrets.choice(chars) for _ in range(8))

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = self.generate_reference()
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255)  # snapshot
    product_type = models.CharField(max_length=20)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"

    @property
    def subtotal(self):
        return self.unit_price * self.quantity


class ShippingNotification(models.Model):
    """Track when admin notifies preorder customers about shipping"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='shipping_notifications')
    sent_at = models.DateTimeField(auto_now_add=True)
    shipping_fee_charged = models.DecimalField(max_digits=10, decimal_places=2)
    paystack_payment_link = models.URLField(blank=True)
    paid = models.BooleanField(default=False)

    def __str__(self):
        return f"Shipping notification for {self.order.reference}"
