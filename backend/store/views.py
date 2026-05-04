import hmac
import hashlib
import json
import requests
from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Category, Product, ProductImage, Order, OrderItem
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    OrderCreateSerializer, OrderSerializer
)


# ── Categories ──────────────────────────────────────────────────────────────

class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


# ── Products ─────────────────────────────────────────────────────────────────

class ProductListView(generics.ListCreateAPIView):
    serializer_class = ProductListSerializer

    def get_queryset(self):
        qs = Product.objects.prefetch_related('images')
        if self.request.query_params.get('admin') != '1':
            qs = qs.filter(status='active')
        category = self.request.query_params.get('category')
        product_type = self.request.query_params.get('type')
        featured = self.request.query_params.get('featured')
        search = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category__slug=category)
        if product_type:
            qs = qs.filter(product_type=product_type)
        if featured == 'true':
            qs = qs.filter(is_featured=True)
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        images = data.pop('images', [])
        if isinstance(images, str):
            import json as _json
            try:
                images = _json.loads(images)
            except Exception:
                images = []
        serializer = ProductListSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        if images:
            product.images.set(images)
        return Response(
            ProductDetailSerializer(product, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    lookup_field = 'slug'

    def get_queryset(self):
        if self.request.method == 'GET':
            return Product.objects.filter(status='active').prefetch_related('images', 'category')
        return Product.objects.all().prefetch_related('images', 'category')

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProductDetailSerializer
        return ProductListSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        images = data.pop('images', None)
        if isinstance(images, str):
            import json as _json
            try:
                images = _json.loads(images)
            except Exception:
                images = None
        serializer = ProductListSerializer(instance, data=data, partial=partial, context={'request': request})
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        if images is not None:
            product.images.set(images)
        return Response(ProductDetailSerializer(product, context={'request': request}).data)


# ── Product Images ────────────────────────────────────────────────────────────

class ProductImageUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'No image provided'}, status=400)
        is_primary = request.data.get('is_primary', 'false') == 'true'
        img = ProductImage.objects.create(image=image_file, is_primary=is_primary)
        url = request.build_absolute_uri(img.image.url)
        return Response({'id': img.id, 'url': url, 'is_primary': img.is_primary}, status=201)


# ── Orders ────────────────────────────────────────────────────────────────────

class OrderCreateView(APIView):
    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save()
            return Response({
                'order_id': str(order.id),
                'reference': order.reference,
                'total_amount': float(order.total_amount),
                'email': order.customer_email,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.prefetch_related('items').order_by('-created_at')


class OrderDetailView(APIView):
    def get(self, request, reference):
        try:
            order = Order.objects.prefetch_related('items').get(reference=reference)
            return Response(OrderSerializer(order).data)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

    def patch(self, request, reference):
        try:
            order = Order.objects.get(reference=reference)
            for field in ['status', 'notes']:
                if field in request.data:
                    setattr(order, field, request.data[field])
            order.save()
            return Response(OrderSerializer(order).data)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)


# ── Payment ───────────────────────────────────────────────────────────────────

class PaystackInitializeView(APIView):
    def post(self, request):
        order_id = request.data.get('order_id')
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)
        if order.payment_verified:
            return Response({'error': 'Already paid'}, status=400)

        amount_kobo = int(float(order.total_amount) * 100)
        base_callback = request.data.get('callback_url') or f"{settings.FRONTEND_URL}/payment/verify"
        callback_url = f"{base_callback}?reference={order.reference}"
        payload = {
            'email': order.customer_email,
            'amount': amount_kobo,
            'reference': order.reference,
            'callback_url': callback_url,
            'metadata': {'order_id': str(order.id), 'customer_name': order.customer_name}
        }
        headers = {'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}', 'Content-Type': 'application/json'}
        try:
            resp = requests.post('https://api.paystack.co/transaction/initialize', json=payload, headers=headers, timeout=10)
            data = resp.json()
            if data.get('status'):
                return Response({
                    'authorization_url': data['data']['authorization_url'],
                    'access_code': data['data']['access_code'],
                    'reference': data['data']['reference'],
                })
            return Response({'error': data.get('message', 'Paystack error')}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class PaystackVerifyView(APIView):
    def get(self, request):
        reference = request.query_params.get('reference')
        if not reference:
            return Response({'error': 'Reference required'}, status=400)
        try:
            order = Order.objects.get(reference=reference)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)
        if order.payment_verified:
            return Response({'status': 'already_verified', 'order': OrderSerializer(order).data})

        headers = {'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}'}
        try:
            resp = requests.get(f'https://api.paystack.co/transaction/verify/{reference}', headers=headers, timeout=10)
            data = resp.json()
            if data.get('status') and data['data']['status'] == 'success':
                order.payment_verified = True
                order.status = Order.STATUS_PAID
                order.payment_date = timezone.now()
                order.paystack_reference = reference
                order.save()
                for item in order.items.all():
                    if item.product and item.product_type == 'available':
                        item.product.stock_quantity = max(0, item.product.stock_quantity - item.quantity)
                        item.product.save()
                _send_customer_receipt(order)
                _send_admin_notification(order)
                return Response({'status': 'success', 'order': OrderSerializer(order).data})
            return Response({'status': 'failed', 'message': 'Payment not successful'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class PaystackWebhookView(APIView):
    def post(self, request):
        payload = request.body
        sig = request.headers.get('x-paystack-signature', '')
        expected = hmac.new(settings.PAYSTACK_SECRET_KEY.encode('utf-8'), payload, hashlib.sha512).hexdigest()
        if sig != expected:
            return Response(status=400)
        event = json.loads(payload)
        if event.get('event') == 'charge.success':
            ref = event['data']['reference']
            try:
                order = Order.objects.get(reference=ref, payment_verified=False)
                order.payment_verified = True
                order.status = Order.STATUS_PAID
                order.payment_date = timezone.now()
                order.save()
                _send_customer_receipt(order)
                _send_admin_notification(order)
            except Order.DoesNotExist:
                pass
        return Response(status=200)


# ── Stats ─────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def store_stats(request):
    return Response({
        'total_products': Product.objects.filter(status='active').count(),
        'available_products': Product.objects.filter(status='active', product_type='available').count(),
        'preorder_products': Product.objects.filter(status='active', product_type='preorder').count(),
        'categories': Category.objects.count(),
    })


# ── Email Helpers ─────────────────────────────────────────────────────────────

def _send_customer_receipt(order):
    whatsapp = settings.WHATSAPP_NUMBER.replace('+', '').replace(' ', '')
    items_text = '\n'.join([f"  - {i.product_name} x{i.quantity} @ GH₵{i.unit_price:,.2f}" for i in order.items.all()])
    wa_msg = (
        f"Hello! I just placed an order on Bel's Haven.\n"
        f"Order Reference: *{order.reference}*\n"
        f"Name: {order.customer_name}\n"
        f"Amount Paid: GH₵{order.total_amount:,.2f}\n"
        f"Please confirm my order. Thank you! 🛍️"
    )
    wa_url = f"https://wa.me/{whatsapp}?text={requests.utils.quote(wa_msg)}"
    body = f"""Hello {order.customer_name},

Thank you for shopping at Bel's Haven! 🖤✨
Your order has been received and payment confirmed.

Reference:  {order.reference}
Date:       {order.created_at.strftime('%B %d, %Y at %I:%M %p')}

Items:
{items_text}

Shipping:   GH₵{order.shipping_fee:,.2f}
Total Paid: GH₵{order.total_amount:,.2f}

Delivery To:
{order.delivery_address}, {order.city}, {order.state}

━━━━━━━━━━━━━━━━━━━━━━
Validate your order on WhatsApp: {wa_url}

With love, Bel's Haven 🌿
"""
    try:
        send_mail(subject=f"Order Confirmed – {order.reference} | Bel's Haven", message=body,
                  from_email=settings.DEFAULT_FROM_EMAIL, recipient_list=[order.customer_email], fail_silently=True)
    except Exception:
        pass
from django.http import JsonResponse

def health(request):
    return JsonResponse({"status": "ok"})


class SendCustomerMessageView(APIView):
    def post(self, request):
        email = request.data.get('email')
        subject = request.data.get('subject', "Message from Bel's Haven")
        message = request.data.get('message')
        if not email or not message:
            return Response({'error': 'Email and message required'}, status=400)
        try:
            send_mail(
                subject=subject,
                message=f"{message}\n\n— Bel's Haven",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            return Response({'status': 'sent'})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

def _send_admin_notification(order):
    notify_email = getattr(settings, 'NOTIFY_EMAIL', None) or getattr(settings, 'ADMIN_EMAIL', None)
    if not notify_email:
        return
    items_text = '\n'.join([f"  • {i.product_name} (x{i.quantity}) – GH₵{i.unit_price:,.2f} [{i.product_type}]" for i in order.items.all()])
    body = f"""New order on Bel's Haven!

{order.customer_name} | {order.customer_email} | {order.customer_phone}
{order.delivery_address}, {order.city}, {order.state}

Order #{order.reference}
{items_text}
Shipping: GH₵{order.shipping_fee:,.2f}
TOTAL: GH₵{order.total_amount:,.2f}
Notes: {order.notes or 'None'}

Manage at: {settings.FRONTEND_URL}/manage
"""
    try:
        send_mail(subject=f"🛍️ New Order: {order.reference} – GH₵{order.total_amount:,.2f}", message=body,
                  from_email=settings.DEFAULT_FROM_EMAIL, recipient_list=[notify_email], fail_silently=True)
    except Exception:
        pass
