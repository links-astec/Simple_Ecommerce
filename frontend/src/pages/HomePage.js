import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Package, Clock, Shield, MessageCircle, Star, ShoppingBag, Gem, Shirt, Lamp, Droplets, Watch, Scissors, Footprints } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../api';
import useLiveRefresh from '../useLiveRefresh';
import './HomePage.css';

const CATEGORY_STYLES = {
  bags: { icon: ShoppingBag, gradient: 'linear-gradient(135deg, #8b6914, #c9a84c, #a67c2e)', emoji: '' },
  'health-and-skincare': { icon: Droplets, gradient: 'linear-gradient(135deg, #2d6a4f, #52b788, #40916c)', emoji: '' },
  clothes: { icon: Shirt, gradient: 'linear-gradient(135deg, #6d3a7d, #9b59b6, #8e44ad)', emoji: '' },
  'household-kitchen--room-dcor': { icon: Lamp, gradient: 'linear-gradient(135deg, #b45309, #d97706, #ca8a04)', emoji: '' },
  perfumes: { icon: Sparkles, gradient: 'linear-gradient(135deg, #be185d, #ec4899, #db2777)', emoji: '' },
  jewelry: { icon: Gem, gradient: 'linear-gradient(135deg, #1e40af, #3b82f6, #2563eb)', emoji: '' },
  'hair-products': { icon: Scissors, gradient: 'linear-gradient(135deg, #374151, #6b7280, #4b5563)', emoji: '' },
  shoes: { icon: Footprints, gradient: 'linear-gradient(135deg, #92400e, #b45309, #a16207)', emoji: '' },
};

function getCategoryStyle(slug) {
  if (CATEGORY_STYLES[slug]) return CATEGORY_STYLES[slug];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return { icon: Package, gradient: `linear-gradient(135deg, hsl(${hue},45%,30%), hsl(${hue},50%,45%), hsl(${hue},40%,35%))`, emoji: '' };
}

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHome = useCallback(() => {
    Promise.all([
      getProducts({ featured: 'true' }),
      getProducts({}),
      getCategories(),
    ]).then(([featRes, latestRes, catRes]) => {
      setFeatured(featRes.data.results || featRes.data);
      setLatest(latestRes.data.results || latestRes.data);
      setCategories(catRes.data.results || catRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadHome(); }, [loadHome]);
  useLiveRefresh(loadHome, 300000);

  const whatsappNumber = process.env.REACT_APP_WHATSAPP_NUMBER || '';

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__content">
          <p className="hero__eyebrow">Welcome to</p>
          <h1 className="hero__title">Bel's<br /><em>Haven</em></h1>
          <div className="gold-line" style={{ margin: '24px auto' }} />
          <p className="hero__subtitle">Curated fashion, beauty & accessories — delivered with intention</p>
          <div className="hero__ctas">
            <Link to="/shop" className="btn-primary"><span>Explore Collection</span><ArrowRight size={16} /></Link>
            <Link to="/shop?type=preorder" className="btn-outline"><span>Pre-order Now</span></Link>
          </div>
        </div>
        <div className="hero__scroll-indicator">
          <span>Scroll</span>
          <div className="hero__scroll-line" />
        </div>
      </section>

      {/* Trust bar */}
      <section className="trust-bar">
        <div className="container">
          <div className="trust-bar__grid">
            <div className="trust-item">
              <Sparkles size={18} className="trust-item__icon" />
              <span>Curated Selection</span>
            </div>
            <div className="trust-item">
              <Package size={18} className="trust-item__icon" />
              <span>Nationwide Delivery</span>
            </div>
            <div className="trust-item">
              <Shield size={18} className="trust-item__icon" />
              <span>Secure Payment</span>
            </div>
            <div className="trust-item">
              <Clock size={18} className="trust-item__icon" />
              <span>Pre-order Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories — horizontal showcase */}
      {categories.length > 0 && (
        <section className="section categories-section">
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">Shop By</p>
              <h2 className="section-title">Categories</h2>
              <div className="gold-line" />
            </div>
            <div className="categories-scroll">
              {categories.map(cat => {
                const style = getCategoryStyle(cat.slug);
                const Icon = style.icon;
                return (
                  <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="cat-card">
                    <div className="cat-card__image">
                      {cat.image
                        ? <img src={cat.image} alt={cat.name} loading="lazy" />
                        : <div className="cat-card__generated" style={{ background: style.gradient }}>
                            <Icon size={40} strokeWidth={1.2} />
                          </div>
                      }
                      <div className="cat-card__overlay" />
                    </div>
                    <div className="cat-card__body">
                      <h3 className="cat-card__name">{cat.name}</h3>
                      <span className="cat-card__count">{cat.product_count} item{cat.product_count !== 1 ? 's' : ''}</span>
                      <span className="cat-card__link">Shop Now <ArrowRight size={12} /></span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {(featured.length > 0 || loading) && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow"><Star size={12} style={{ verticalAlign: '-1px' }} /> Handpicked for You</p>
              <h2 className="section-title">Featured Pieces</h2>
              <div className="gold-line" />
            </div>
            {loading ? (
              <div className="products-loading">
                {[...Array(4)].map((_, i) => <div key={i} className="product-skeleton" />)}
              </div>
            ) : (
              <div className="products-grid">
                {featured.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <Link to="/shop" className="btn-outline"><span>View All Products</span><ArrowRight size={14} /></Link>
            </div>
          </div>
        </section>
      )}

      {/* Brand story banner */}
      <section className="brand-banner">
        <div className="container">
          <div className="brand-banner__inner">
            <div className="brand-banner__text">
              <p className="section-eyebrow">Our Story</p>
              <h2>More Than Just a Store</h2>
              <p className="brand-banner__desc">
                Bel's Haven is a curated marketplace bringing the finest fashion, beauty, and lifestyle products to Ghana.
                Every item is hand-selected for quality, style, and value — because you deserve nothing less.
              </p>
              <Link to="/shop" className="btn-outline"><span>Start Shopping</span><ArrowRight size={14} /></Link>
            </div>
            <div className="brand-banner__visual">
              <div className="brand-banner__pattern" />
              <div className="brand-banner__quote">
                <span className="brand-banner__mark">"</span>
                <p>Fashion is about comfort, confidence, and expressing who you truly are.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {latest.length > 4 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">Just Dropped</p>
              <h2 className="section-title">New Arrivals</h2>
              <div className="gold-line" />
            </div>
            <div className="products-grid">
              {latest.filter(p => !featured.find(f => f.id === p.id)).slice(0, 4).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Preorder CTA */}
      <section className="preorder-cta">
        <div className="container">
          <div className="preorder-cta__inner">
            <div className="preorder-cta__glow" />
            <p className="section-eyebrow">Don't Miss Out</p>
            <h2>Reserve Before It Arrives</h2>
            <p className="preorder-cta__text">
              Our pre-order items sell out fast. Secure yours today and be the first to receive it when it lands.
            </p>
            <Link to="/shop?type=preorder" className="btn-primary"><span>Browse Pre-orders</span><ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* WhatsApp contact */}
      {whatsappNumber && (
        <section className="wa-section">
          <div className="container">
            <div className="wa-section__inner">
              <MessageCircle size={28} className="wa-section__icon" />
              <div>
                <h3>Need Help? Chat With Us</h3>
                <p>We're always available on WhatsApp to help you find the perfect piece.</p>
              </div>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="btn-primary wa-section__btn">
                <MessageCircle size={16} /><span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
