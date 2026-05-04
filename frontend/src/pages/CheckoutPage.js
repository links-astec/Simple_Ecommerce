import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Lock } from 'lucide-react';
import { useCart } from '../CartContext';
import { createOrder, initializePayment } from '../api';
import toast from 'react-hot-toast';
import './CheckoutPage.css';

const GHANAIAN_REGIONS = [
  'Ahafo','Ashanti','Bono','Bono East','Central','Eastern',
  'Greater Accra','North East','Northern','Oti','Savannah',
  'Upper East','Upper West','Volta','Western','Western North'
];

export default function CheckoutPage() {
  const { items, subtotal, totalShipping, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    delivery_address: '', city: '', state: '', country: 'Ghana', notes: ''
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    const required = ['customer_name', 'customer_email', 'customer_phone', 'delivery_address', 'city', 'state'];
    for (const k of required) {
      if (!form[k].trim()) {
        toast.error(`Please fill in ${k.replace('customer_', '').replace('_', ' ')}`);
        return;
      }
    }
    if (!form.customer_email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        ...form,
        items: items.map(i => ({
          product_id: i.id,
          quantity: i.quantity,
        }))
      };

      const { data: order } = await createOrder(orderData);
      const { data: payment } = await initializePayment(order.order_id);

      // Redirect to Paystack
      if (payment.authorization_url) {
        clearCart();
        window.location.href = payment.authorization_url;
      } else {
        toast.error('Could not initialize payment. Please try again.');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail
        || err.response?.data?.error
        || (typeof err.response?.data === 'string' ? err.response.data : null)
        || err.message
        || 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <h1>Checkout</h1>
          <div className="gold-line" style={{ margin: '12px 0 0' }} />
        </div>

        <div className="checkout-grid">
          {/* Form */}
          <div className="checkout-form">
            <section className="form-section">
              <h3>Contact Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input className="input-field" placeholder="Adaeze Johnson" value={form.customer_name} onChange={set('customer_name')} />
                </div>
              </div>
              <div className="form-row form-row--2">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input className="input-field" type="email" placeholder="you@example.com" value={form.customer_email} onChange={set('customer_email')} />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input className="input-field" type="tel" placeholder="08012345678" value={form.customer_phone} onChange={set('customer_phone')} />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Delivery Address</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Street Address *</label>
                  <input className="input-field" placeholder="12 Broad Street, Victoria Island" value={form.delivery_address} onChange={set('delivery_address')} />
                </div>
              </div>
              <div className="form-row form-row--3">
                <div className="form-group">
                  <label>City *</label>
                  <input className="input-field" placeholder="Lagos" value={form.city} onChange={set('city')} />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <select className="input-field" value={form.state} onChange={set('state')}>
                    <option value="">Select Region</option>
                    {GHANAIAN_REGIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input className="input-field" value={form.country} onChange={set('country')} />
                </div>
              </div>
              <div className="form-group">
                <label>Order Notes (optional)</label>
                <textarea className="input-field" rows={3} placeholder="Any special instructions..." value={form.notes} onChange={set('notes')} style={{ resize: 'vertical' }} />
              </div>
            </section>
          </div>

          {/* Order summary */}
          <div className="checkout-summary">
            <div className="checkout-summary__inner">
              <h3>Your Order</h3>
              <div className="gold-line" style={{ margin: '16px 0' }} />

              <div className="checkout-items">
                {items.map(item => (
                  <div key={item.id} className="checkout-item">
                    <div className="checkout-item__image">
                      {item.primary_image
                        ? <img src={item.primary_image} alt={item.name} />
                        : <Package size={20} />
                      }
                      <span className="checkout-item__qty">{item.quantity}</span>
                    </div>
                    <div className="checkout-item__info">
                      <p className="checkout-item__name">{item.name}</p>
                      {item.product_type === 'preorder' && <span className="badge badge-preorder" style={{ fontSize: '0.55rem' }}>Pre-order</span>}
                    </div>
                    <span className="checkout-item__price price">
                      GH₵{(parseFloat(item.price) * item.quantity).toLocaleString('en-GH')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="checkout-totals">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>GH₵{subtotal.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>GH₵{totalShipping.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="summary-row summary-row--total">
                  <span>Total</span>
                  <span className="price">GH₵{total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                className="btn-primary checkout-submit"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <><div className="spinner" /> <span>Processing...</span></>
                ) : (
                  <><Lock size={15} /> <span>Pay GH₵{total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span></>
                )}
              </button>

              <div className="checkout-security">
                <Lock size={12} />
                <span>Secured by Paystack. Your payment info is safe.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
