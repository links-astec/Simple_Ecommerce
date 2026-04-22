import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, MapPin, Clock, MessageCircle } from 'lucide-react';
import { getOrder } from '../api';
import './OrderConfirmPage.css';

export default function OrderConfirmPage() {
  const { reference } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrder(reference)
      .then(res => setOrder(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [reference]);

  const whatsappNumber = process.env.REACT_APP_WHATSAPP_NUMBER || '';

  const whatsappUrl = order
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Hello! I just placed an order on Bel's Haven.\nOrder Reference: *${order.reference}*\nName: ${order.customer_name}\nAmount Paid: GH₵${parseFloat(order.total_amount).toLocaleString('en-GH')}\nPlease confirm my order. Thank you! 🛍️`
      )}`
    : '#';

  if (loading) return (
    <div className="order-page order-page--loading">
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  if (!order) return (
    <div className="order-page">
      <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>Order not found</h2>
        <Link to="/shop" className="btn-outline" style={{ marginTop: 24, display: 'inline-flex' }}>Back to Shop</Link>
      </div>
    </div>
  );

  return (
    <div className="order-page">
      <div className="container">
        <div className="order-card">
          <div className="order-card__glow" />
          <div className="order-card__header">
            <p className="section-eyebrow">Order Details</p>
            <h1>{order.reference}</h1>
            <span className={`badge order-status-badge order-status--${order.status}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>

          <div className="order-grid">
            {/* Items */}
            <div className="order-section">
              <h3><Package size={16} /> Items Ordered</h3>
              <div className="order-items">
                {order.items.map(item => (
                  <div key={item.id} className="order-item">
                    <div className="order-item__info">
                      <p className="order-item__name">{item.product_name}</p>
                      {item.product_type === 'preorder' && <span className="badge badge-preorder" style={{ fontSize: '0.55rem' }}>Pre-order</span>}
                    </div>
                    <span className="order-item__qty">x{item.quantity}</span>
                    <span className="price order-item__price">GH₵{(parseFloat(item.unit_price) * item.quantity).toLocaleString('en-GH')}</span>
                  </div>
                ))}
              </div>
              <div className="order-totals">
                <div className="order-total-row">
                  <span>Shipping</span>
                  <span>GH₵{parseFloat(order.shipping_fee).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="order-total-row order-total-row--grand">
                  <span>Total Paid</span>
                  <span className="price">GH₵{parseFloat(order.total_amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="order-side">
              <div className="order-section">
                <h3><MapPin size={16} /> Delivery Address</h3>
                <div className="order-address">
                  <p className="order-address__name">{order.customer_name}</p>
                  <p>{order.delivery_address}</p>
                  <p>{order.city}, {order.state}</p>
                  <p>{order.country}</p>
                  <p>{order.customer_phone}</p>
                  <p>{order.customer_email}</p>
                </div>
              </div>

              <div className="order-section">
                <h3><Clock size={16} /> Order Placed</h3>
                <p className="order-date">{new Date(order.created_at).toLocaleDateString('en-GH', { dateStyle: 'long' })}</p>
              </div>

              {/* WhatsApp CTA */}
              <div className="order-whatsapp">
                <p>Validate your order by sending your reference on WhatsApp:</p>
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-primary order-whatsapp__btn">
                  <MessageCircle size={16} />
                  <span>Validate on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/shop" className="btn-outline"><span>Continue Shopping</span></Link>
        </div>
      </div>
    </div>
  );
}
