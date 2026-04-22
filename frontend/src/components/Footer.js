import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, MessageCircle } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();
  const whatsapp = process.env.REACT_APP_WHATSAPP_NUMBER || '';

  return (
    <footer className="footer">
      <div className="footer__glow" />
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <h2 className="footer__logo">Bel's Haven</h2>
            <p className="footer__tagline">curated luxury, delivered with love</p>
            <div className="footer__socials">
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                  <MessageCircle size={18} />
                </a>
              )}
              <a href="mailto:hello@belshaven.com" aria-label="Email">
                <Mail size={18} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          <div className="footer__col">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop">All Products</Link></li>
              <li><Link to="/shop?type=available">Available Now</Link></li>
              <li><Link to="/shop?type=preorder">Pre-order</Link></li>
            </ul>
          </div>

          <div className="footer__col">
            <h4>Help</h4>
            <ul>
              <li><a href={whatsapp ? `https://wa.me/${whatsapp}` : '#'} target="_blank" rel="noreferrer">Contact Us</a></li>
              <li><Link to="/shop">Track Order</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="gold-line" style={{ margin: '0 0 24px' }} />
          <p>© {year} Bel's Haven. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
