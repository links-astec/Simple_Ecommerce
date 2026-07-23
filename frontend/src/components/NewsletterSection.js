import React, { useState } from 'react';
import { subscribeNewsletter } from '../api';
import './NewsletterSection.css';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | already | error
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    setError('');
    try {
      const res = await subscribeNewsletter(email.trim());
      if (res.data?.status === 'already_subscribed') {
        setStatus('already');
      } else {
        setStatus('success');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section className="nl-section">
      <div className="nl-glow" />

      <div className="nl-container">
        {status === 'success' && (
          <div className="nl-success">
            {[...Array(12)].map((_, i) => (
              <span key={i} className={`nl-spark nl-spark--${i + 1}`} />
            ))}
            <div className="nl-success__icon">✦</div>
            <h2 className="nl-success__title">You're in the circle</h2>
            <p className="nl-success__sub">Thank you for joining us.<br />Expect something beautiful soon.</p>
          </div>
        )}

        {status === 'already' && (
          <div className="nl-success nl-already">
            <div className="nl-already__icon">◈</div>
            <h2 className="nl-success__title">You're already in</h2>
            <p className="nl-success__sub">This email is already part of our circle.<br />We'll keep you updated with everything beautiful.</p>
          </div>
        )}

        {status !== 'success' && status !== 'already' && (
          <div className="nl-content">
            <div className="nl-diamond">◆</div>
            <p className="nl-eyebrow">Exclusive Access</p>
            <h2 className="nl-title">Join the Circle</h2>
            <p className="nl-sub">
              Be the first to know about new arrivals,<br />
              exclusive drops &amp; curated picks — delivered to you.
            </p>

            <form className="nl-form" onSubmit={handleSubmit}>
              <div className="nl-input-wrap">
                <input
                  type="email"
                  className="nl-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  required
                />
                <button type="submit" className="nl-btn" disabled={status === 'loading'}>
                  {status === 'loading'
                    ? <span className="nl-btn-dots"><span /><span /><span /></span>
                    : 'Subscribe'
                  }
                </button>
              </div>
              {status === 'error' && <p className="nl-error">{error}</p>}
            </form>

            <p className="nl-note">No spam, ever. Unsubscribe anytime.</p>
          </div>
        )}
      </div>
    </section>
  );
}
