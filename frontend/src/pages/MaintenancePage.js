import React from 'react';
import { Wrench } from 'lucide-react';
import './MaintenancePage.css';

export default function MaintenancePage() {
  return (
    <div className="maintenance-page">
      <div className="maintenance-page__bg" />
      <div className="maintenance-card">
        <div className="maintenance-card__icon">
          <Wrench size={32} />
        </div>
        <p className="maintenance-card__eyebrow">Bel's Haven</p>
        <h1 className="maintenance-card__title">We'll be right back</h1>
        <div className="maintenance-card__line" />
        <p className="maintenance-card__text">
          We're currently making improvements to bring you a better experience.
          Please check back soon.
        </p>
        <p className="maintenance-card__contact">
          Need urgent assistance?{' '}
          <a
            href={`https://wa.me/${process.env.REACT_APP_WHATSAPP || ''}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact us on WhatsApp
          </a>
        </p>
      </div>
    </div>
  );
}
