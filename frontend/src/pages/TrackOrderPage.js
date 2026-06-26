import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, MapPin, Clock, CheckCircle, Truck, Box, XCircle, MessageCircle, Mail } from 'lucide-react';
import { getOrder, sendOrderLookupCode, verifyOrderLookupCode } from '../api';
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

function updateSavedOrderStatus(ref, newStatus) {
  try {
    const saved = JSON.parse(localStorage.getItem('bh_orders') || '[]');
    const idx = saved.findIndex(o => o.reference === ref);
    if (idx !== -1) {
      saved[idx].status = newStatus;
      localStorage.setItem('bh_orders', JSON.stringify(saved));
    }
  } catch {}
}

export default function TrackOrderPage() {
  const [mode, setMode] = useState('reference');
  const [reference, setReference] = useState('');
  const [email, setEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [order, setOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedOrders, setSavedOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bh_orders') || '[]'); } catch { return []; }
  });

  const trackByRef = async () => {
    const ref = reference.trim().toUpperCase();
    if (!ref) { setError('Please enter your order reference.'); return; }
    setLoading(true);
    setError('');
    setOrder(null);
    setOrders([]);
    try {
      const res = await getOrder(ref);
      setOrder(res.data);
      updateSavedOrderStatus(res.data.reference, res.data.status);
      setSavedOrders(prev => {
        try { return JSON.parse(localStorage.getItem('bh_orders') || '[]'); } catch { return prev; }
      });
    } catch {
      setError('Order not found. Please check your reference and try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async () => {
    const e = email.trim();
    if (!e) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');
    try {
      await sendOrderLookupCode(e);
      setCodeSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const trackByEmail = async () => {
    const e = email.trim();
    const c = verifyCode.trim();
    if (!c) { setError('Please enter the verification code.'); return; }
    setLoading(true);
    setError('');
    setOrder(null);
    setOrders([]);
    try {
      const res = await verifyOrderLookupCode(e, c);
      const data = res.data.results || res.data || [];
      if (data.length === 0) {
        setError('No orders found.');
      } else {
        setOrders(data);
        setCodeSent(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const whatsappNumber = process.env.REACT_APP_WHATSAPP_NUMBER || '';
  const activeOrder = order || null;
  const waUrl = activeOrder
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Hello! I'd like to check the status of my order.\nReference: *${activeOrder.reference}*\nName: ${activeOrder.customer_name}`
      )}`
    : '#';

  const currentStep = STATUS_STEPS.indexOf(activeOrder?.status);
  const isCancelled = activeOrder?.status === 'cancelled';

  return (
    <div className="track-page">
      <div className="container">
        <div className="track-header">
          <p className="section-eyebrow">Order Tracking</p>
          <h1>Track Your Order</h1>
          <div className="gold-line" style={{ margin: '12px auto 0' }} />
        </div>

        <div className="track-mode-toggle">
          <button
            className={`track-mode-btn ${mode === 'reference' ? 'active' : ''}`}
            onClick={() => { setMode('reference'); setError(''); setOrders([]); setOrder(null); setCodeSent(false); setVerifyCode(''); }}
          >
            <Search size={14} />
            <span>By Reference</span>
          </button>
          <button
            className={`track-mode-btn ${mode === 'email' ? 'active' : ''}`}
            onClick={() => { setMode('email'); setError(''); setOrders([]); setOrder(null); setCodeSent(false); setVerifyCode(''); }}
          >
            <Mail size={14} />
            <span>By Email</span>
          </button>
        </div>

        {mode === 'reference' && (
          <div className="track-search">
            <input
              className="input-field track-search__input"
              placeholder="e.g. BHXXXXXXXX"
              value={reference}
              onChange={e => { setReference(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && trackByRef()}
            />
            <button className="btn-primary track-search__btn" onClick={trackByRef} disabled={loading}>
              {loading ? <div className="spinner" /> : <Search size={16} />}
              <span>{loading ? 'Searching...' : 'Track Order'}</span>
            </button>
          </div>
        )}

        {mode === 'email' && !codeSent && (
          <div className="track-search">
            <input
              className="input-field track-search__input"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && sendCode()}
            />
            <button className="btn-primary track-search__btn" onClick={sendCode} disabled={loading}>
              {loading ? <div className="spinner" /> : <Mail size={16} />}
              <span>{loading ? 'Sending...' : 'Send Code'}</span>
            </button>
          </div>
        )}

        {mode === 'email' && codeSent && orders.length === 0 && (
          <div className="track-verify">
            <p className="track-verify__msg">We sent a verification code to <strong>{email}</strong>. Check your inbox and enter it below.</p>
            <div className="track-search">
              <input
                className="input-field track-search__input"
                placeholder="Enter code"
                value={verifyCode}
                onChange={e => { setVerifyCode(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && trackByEmail()}
                autoFocus
                style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}
              />
              <button className="btn-primary track-search__btn" onClick={trackByEmail} disabled={loading}>
                {loading ? <div className="spinner" /> : <Search size={16} />}
                <span>{loading ? 'Verifying...' : 'Verify'}</span>
              </button>
            </div>
            <button className="track-resend" onClick={() => { setCodeSent(false); setVerifyCode(''); setError(''); }}>
              Use a different email
            </button>
          </div>
        )}

        {error && <p className="track-error">{error}</p>}

        {/* Saved orders from localStorage */}
        {savedOrders.length > 0 && !order && orders.length === 0 && !loading && (
          <div className="track-saved">
            <p className="track-saved__title">Your Recent Orders</p>
            <div className="track-saved__list">
              {savedOrders.map(o => (
                <button
                  key={o.reference}
                  className="track-order-card"
                  onClick={() => { setReference(o.reference); setMode('reference'); setError(''); setOrder(null); setOrders([]); setLoading(true);
                    getOrder(o.reference).then(res => { setOrder(res.data); updateSavedOrderStatus(res.data.reference, res.data.status); setSavedOrders(JSON.parse(localStorage.getItem('bh_orders') || '[]')); }).catch(() => setError('Could not load order.')).finally(() => setLoading(false));
                  }}
                >
                  <div className="track-order-card__left">
                    <span className="track-order-card__ref">{o.reference}</span>
                    <span className="track-order-card__date">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('en-GH', { dateStyle: 'medium' }) : ''}
                    </span>
                    {o.items_summary && <span className="track-order-card__items">{o.items_summary}</span>}
                  </div>
                  <div className="track-order-card__right">
                    <span className="price">GH₵{parseFloat(o.total_amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                    <span className="badge" style={{ color: STATUS_META[o.status]?.color, fontSize: '0.55rem' }}>
                      {STATUS_META[o.status]?.label || o.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Email results - order list */}
        {orders.length > 0 && !order && (
          <div className="track-email-results">
            <p className="track-email-count">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
            {orders.map(o => (
              <button
                key={o.reference}
                className="track-order-card"
                onClick={() => setOrder(o)}
              >
                <div className="track-order-card__left">
                  <span className="track-order-card__ref">{o.reference}</span>
                  <span className="track-order-card__date">
                    {new Date(o.created_at).toLocaleDateString('en-GH', { dateStyle: 'medium' })}
                  </span>
                </div>
                <div className="track-order-card__right">
                  <span className="price">GH₵{parseFloat(o.total_amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                  <span
                    className="badge"
                    style={{ color: STATUS_META[o.status]?.color, fontSize: '0.55rem' }}
                  >
                    {STATUS_META[o.status]?.label || o.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Single order detail */}
        {activeOrder && (
          <div className="track-result">
            {orders.length > 0 && (
              <button className="track-back-btn" onClick={() => setOrder(null)}>
                ← Back to all orders
              </button>
            )}
            <div className="track-result__top">
              <div>
                <p className="section-eyebrow">Order Reference</p>
                <h2 className="track-ref">{activeOrder.reference}</h2>
              </div>
              <span
                className="badge track-status-badge"
                style={{ color: STATUS_META[activeOrder.status]?.color }}
              >
                {STATUS_META[activeOrder.status]?.label || activeOrder.status}
              </span>
            </div>

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
              <div className="track-card">
                <h4><Package size={15} /> Items Ordered</h4>
                <div className="track-items">
                  {activeOrder.items.map(item => (
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
                    <span>GH₵{parseFloat(activeOrder.shipping_fee).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="track-total-row track-total-row--grand">
                    <span>Total {activeOrder.payment_verified ? 'Paid' : 'Due'}</span>
                    <span className="price">GH₵{parseFloat(activeOrder.total_amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="track-card">
                <h4><MapPin size={15} /> Delivery Address</h4>
                <p>{activeOrder.customer_name}</p>
                <p>{activeOrder.delivery_address}</p>
                <p>{activeOrder.city}, {activeOrder.state}</p>
                <p>{activeOrder.country}</p>

                <h4 style={{ marginTop: 20 }}><Clock size={15} /> Order Placed</h4>
                <p>{new Date(activeOrder.created_at).toLocaleDateString('en-GH', { dateStyle: 'long' })}</p>

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
