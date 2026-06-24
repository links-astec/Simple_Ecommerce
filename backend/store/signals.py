import json
import logging
import threading
from django.conf import settings
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

logger = logging.getLogger(__name__)

_backup_timer = None
_backup_lock = threading.Lock()

BACKUP_DELAY = 10


def _do_backup():
    from .models import Category, Product, Order, OrderItem
    try:
        import cloudinary.uploader
    except ImportError:
        return

    if not getattr(settings, 'CLOUDINARY_URL', None) and not getattr(settings, 'DEFAULT_FILE_STORAGE', '').startswith('cloudinary'):
        return

    try:
        from django.utils import timezone
        now = timezone.now()

        categories = list(Category.objects.values('id', 'name', 'slug', 'description'))

        products = []
        for p in Product.objects.select_related('category', 'parent').prefetch_related('images').all():
            products.append({
                'id': str(p.id), 'name': p.name, 'slug': p.slug,
                'description': p.description, 'price': str(p.price),
                'shipping_fee': str(p.shipping_fee), 'product_type': p.product_type,
                'status': p.status, 'stock_quantity': p.stock_quantity,
                'delivery_timeframe': p.delivery_timeframe,
                'preorder_eta': p.preorder_eta,
                'preorder_shipping_fee': str(p.preorder_shipping_fee),
                'is_featured': p.is_featured,
                'category': p.category.name if p.category else '',
                'variant_label': p.variant_label,
                'parent_slug': p.parent.slug if p.parent else '',
                'images': [img.image.url for img in p.images.all()],
                'created_at': p.created_at.isoformat() if p.created_at else '',
            })

        orders = []
        order_items = []
        customers_seen = set()
        customers = []
        for o in Order.objects.prefetch_related('items').all():
            orders.append({
                'id': str(o.id), 'reference': o.reference,
                'customer_name': o.customer_name, 'customer_email': o.customer_email,
                'customer_phone': o.customer_phone,
                'delivery_address': o.delivery_address, 'city': o.city,
                'state': o.state, 'country': o.country,
                'status': o.status, 'total_amount': str(o.total_amount),
                'shipping_fee': str(o.shipping_fee),
                'payment_verified': o.payment_verified,
                'payment_date': o.payment_date.isoformat() if o.payment_date else '',
                'notes': o.notes,
                'created_at': o.created_at.isoformat() if o.created_at else '',
            })
            for item in o.items.all():
                order_items.append({
                    'order_reference': o.reference,
                    'product_name': item.product_name,
                    'product_type': item.product_type,
                    'quantity': item.quantity,
                    'unit_price': str(item.unit_price),
                    'shipping_fee': str(item.shipping_fee),
                })
            key = o.customer_email.lower()
            if key not in customers_seen:
                customers_seen.add(key)
                customers.append({
                    'name': o.customer_name, 'email': o.customer_email,
                    'phone': o.customer_phone,
                    'address': o.delivery_address, 'city': o.city,
                    'state': o.state, 'country': o.country,
                })

        data = {
            'exported_at': now.isoformat(),
            'categories': categories,
            'products': products,
            'orders': orders,
            'order_items': order_items,
            'customers': customers,
        }

        raw = json.dumps(data, indent=2, default=str)

        cloudinary.uploader.upload(
            raw.encode('utf-8'),
            resource_type='raw',
            public_id='backups/bels-haven-latest',
            overwrite=True,
            format='json',
        )
        logger.info('Auto-backup uploaded to Cloudinary (%d products, %d orders)', len(products), len(orders))
    except Exception:
        logger.exception('Auto-backup to Cloudinary failed')


def schedule_backup(**kwargs):
    global _backup_timer
    with _backup_lock:
        if _backup_timer is not None:
            _backup_timer.cancel()
        _backup_timer = threading.Timer(BACKUP_DELAY, _do_backup)
        _backup_timer.daemon = True
        _backup_timer.start()


def connect_signals():
    from .models import Category, Product, Order, OrderItem

    for model in [Category, Product, Order, OrderItem]:
        post_save.connect(schedule_backup, sender=model, dispatch_uid=f'backup_{model.__name__}_save')
        post_delete.connect(schedule_backup, sender=model, dispatch_uid=f'backup_{model.__name__}_delete')
