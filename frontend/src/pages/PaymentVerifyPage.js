import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { verifyPayment } from '../api';
import './PaymentVerifyPage.css';

export default function PaymentVerifyPage() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const [status, setStatus] = useState('loading');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!reference) { setStatus('error'); return; }
    verifyPayment(reference)
      .then(res => {
        const o = res.data.order;
        setOrder(o);
        setStatus('success');
        try {
          const saved = JSON.parse(localStorage.getItem('bh_orders') || '[]');
          if (!saved.find(s => s.reference === o.reference)) {
            saved.unshift({
              reference: o.reference,
              total_amount: o.total_amount,
              status: o.status,
              created_at: o.created_at,
              items_summary: o.items.map(i => i.product_name).join(', '),
            });
            localStorage.setItem('bh_orders', JSON.stringify(saved.slice(0, 20)));
          }
        } catch {}
      })
      .catch(() => setStatus('error'));
  }, [reference]);

  if (status === 'loading') return (
    <div className="verify-page verify-page--loading">
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      <p>Verifying your payment...</p>
    </div>
  );

  if (status === 'error') return (
    <div className="verify-page">
      <div className="verify-card">
        <XCircle size={56} className="verify-icon verify-icon--error" />
        <h2>Payment Verification Failed</h2>
        <p>We couldn't verify your payment. Please contact us on WhatsApp with your order reference.</p>
        <Link to="/shop" className="btn-outline">Return to Shop</Link>
      </div>
    </div>
  );

  return (
    <div className="verify-page">
      <div className="verify-card">
        <div className="verify-glow" />
        <CheckCircle size={56} className="verify-icon verify-icon--success" />
        <p className="verify-eyebrow">Payment Confirmed</p>
        <h2>Thank you, {order?.customer_name?.split(' ')[0]}!</h2>
        <div className="gold-line" style={{ margin: '16px auto' }} />
        <p className="verify-sub">Your order has been received. A receipt has been sent to <strong>{order?.customer_email}</strong></p>

        <div className="verify-ref">
          <span>Order Reference</span>
          <strong>{order?.reference}</strong>
        </div>

        <div className="verify-total">
          <span>Amount Paid</span>
          <span className="price">GH₵{parseFloat(order?.total_amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="verify-whatsapp-note">
          <p>📱 <strong>Important:</strong> Please send your order reference to us on WhatsApp to validate and process your order. Check your email for the direct link.</p>
        </div>

        <div className="verify-actions">
          <Link to={`/order/${order?.reference}`} className="btn-primary"><span>View Order Details</span></Link>
          <Link to="/shop" className="btn-outline"><span>Continue Shopping</span></Link>
        </div>
      </div>
    </div>
  );
}
