import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, MapPin, Clock, CheckCircle, Truck, Box, XCircle, MessageCircle } from 'lucide-react';
import { getOrder } from '../api';
import './TrackOrderPage.css';

const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

const STATUS_META = {
  pending:    { label: 'Pending Payment', icon: Clock,        color: '#9a9080' },
  paid:       { label: 'Payment Confirmed', icon: CheckCircle, color: '#c9a84c' },
  processing: { label: 'Processing',       icon: Box,          color: '#4a90d9' },
  shipped:    { label: 'Shipped',          icon: Truck,        color: '#9b59b6' },
  delivered:  { label: 'Delivered',        icon: Package,      color: '#4caf7d' },
  cancelled:  { label: 'Cancelled',        icon: XCircle,      color: '#e05a5a' },
};

export default function TrackOrderPage() {
  const [reference, setReference] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const track = async () => {
    const ref = reference.trim().toUpperCase();
    if (!ref) { setError('Please enter your order reference.'); return; }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await getOrder(ref);
      setOrder(res.data);
    } catch {
      setError('Order not found. Please check your reference and try again.');
    } finally {
      setLoading(false);
    }
  };

  const whatsappNumber = process.env.REACT_APP_WHATSAPP_NUMBER || '';
  const waUrl = order
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Hello! I'd like to check the status of my order.\nReference: *${order.reference}*\nName: ${order.customer_name}`
      )}`
    : '#';

  const currentStep = STATUS_STEPS.indexOf(order?.status);
  const isCancelled = order?.status === 'cancelled';

  return (
    <div className="track-page">
      <div className="container">
        <div className="track-header">
          <p className="section-eyebrow">Order Tracking</p>
          <h1>Track Your Order</h1>
          <div className="gold-line" style={{ margin: '12px auto 0' }} />
          <p className="track-header__sub">Enter the reference number from your confirmation email.</p>
        </div>

        <div className="track-search">
          <input
            className="input-field track-search__input"
            placeholder="e.g. BHXXXXXXXX"
            value={reference}
            onChange={e => { setReference(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && track()}
          />
          <button className="btn-primary track-search__btn" onClick={track} disabled={loading}>
            {loading ? <div className="spinner" /> : <Search size={16} />}
            <span>{loading ? 'Searching...' : 'Track Order'}</span>
          </button>
        </div>

        {error && <p className="track-error">{error}</p>}

        {order && (
          <div className="track-result">
            <div className="track-result__top">
              <div>
                <p className="section-eyebrow">Order Reference</p>
                <h2 className="track-ref">{order.reference}</h2>
              </div>
              <span
                className="badge track-status-badge"
                style={{ color: STATUS_META[order.status]?.color }}
              >
                {STATUS_META[order.status]?.label || order.status}
              </span>
            </div>

            {/* Progress timeline */}
            {!isCancelled && (
              <div className="track-timeline">
                {STATUS_STEPS.map((step, i) => {
                  const meta = STATUS_META[step];
                  const Icon = meta.icon;
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <React.Fragment key={step}>
                      <div className={`track-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                        <div className="track-step__icon" style={done ? { borderColor: meta.color, color: meta.color } : {}}>
                          <Icon size={16} />
                        </div>
                        <span className="track-step__label">{meta.label}</span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`track-connector ${i < currentStep ? 'done' : ''}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {isCancelled && (
              <div className="track-cancelled">
                <XCircle size={20} style={{ color: '#e05a5a' }} />
                <span>This order has been cancelled. Contact us on WhatsApp if you need help.</span>
              </div>
            )}

            <div className="track-grid">
              {/* Items */}
              <div className="track-card">
                <h4><Package size={15} /> Items Ordered</h4>
                <div className="track-items">
                  {order.items.map(item => (
                    <div key={item.id} className="track-item">
                      <div className="track-item__info">
                        <span className="track-item__name">{item.product_name}</span>
                        {item.product_type === 'preorder' && (
                          <span className="badge badge-preorder" style={{ fontSize: '0.5rem' }}>Pre-order</span>
                        )}
                      </div>
                      <span className="track-item__qty">x{item.quantity}</span>
                      <span className="price track-item__price">
                        GH₵{(parseFloat(item.unit_price) * item.quantity).toLocaleString('en-GH')}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="track-totals">
                  <div className="track-total-row">
                    <span>Shipping</span>
                    <span>GH₵{parseFloat(order.shipping_fee).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="track-total-row track-total-row--grand">
                    <span>Total {order.payment_verified ? 'Paid' : 'Due'}</span>
                    <span className="price">GH₵{parseFloat(order.total_amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Delivery + contact */}
              <div className="track-card">
                <h4><MapPin size={15} /> Delivery Address</h4>
                <p>{order.customer_name}</p>
                <p>{order.delivery_address}</p>
                <p>{order.city}, {order.state}</p>
                <p>{order.country}</p>

                <h4 style={{ marginTop: 20 }}><Clock size={15} /> Order Placed</h4>
                <p>{new Date(order.created_at).toLocaleDateString('en-GH', { dateStyle: 'long' })}</p>

                <div className="track-wa">
                  <p>Questions about your order?</p>
                  <a href={waUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'inline-flex', gap: 8, marginTop: 8 }}>
                    <MessageCircle size={15} />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/shop" className="btn-outline"><span>Continue Shopping</span></Link>
        </div>
      </div>
    </div>
  );
}
