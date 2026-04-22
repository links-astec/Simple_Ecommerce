import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Package, Clock } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../api';
import './HomePage.css';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProducts({ featured: 'true' }),
      getCategories(),
    ]).then(([prodRes, catRes]) => {
      setFeatured(prodRes.data.results || prodRes.data);
      setCategories(catRes.data.results || catRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__content">
          <p className="hero__eyebrow">Welcome to</p>
          <h1 className="hero__title">
            Bel's<br /><em>Haven</em>
          </h1>
          <div className="gold-line" style={{ margin: '24px auto' }} />
          <p className="hero__subtitle">
            Curated fashion, beauty & accessories — delivered with intention
          </p>
          <div className="hero__ctas">
            <Link to="/shop" className="btn-primary">
              <span>Explore Collection</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/shop?type=preorder" className="btn-outline">
              <span>Pre-order Now</span>
            </Link>
          </div>
        </div>
        <div className="hero__scroll-indicator">
          <span>Scroll</span>
          <div className="hero__scroll-line" />
        </div>
      </section>

      {/* Features strip */}
      <section className="features-strip">
        <div className="container">
          <div className="features-strip__grid">
            <div className="feature-item">
              <Sparkles size={20} className="feature-item__icon" />
              <div>
                <h4>Curated Selection</h4>
                <p>Only the finest pieces make it here</p>
              </div>
            </div>
            <div className="feature-item">
              <Package size={20} className="feature-item__icon" />
              <div>
                <h4>Swift Delivery</h4>
                <p>Fast, reliable shipping nationwide</p>
              </div>
            </div>
            <div className="feature-item">
              <Clock size={20} className="feature-item__icon" />
              <div>
                <h4>Pre-order Available</h4>
                <p>Reserve yours before it's gone</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {(featured.length > 0 || loading) && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">Handpicked for You</p>
              <h2 className="section-title">Featured Pieces</h2>
              <div className="gold-line" />
            </div>
            {loading ? (
              <div className="products-loading">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="product-skeleton" />
                ))}
              </div>
            ) : (
              <div className="products-grid">
                {featured.slice(0, 8).map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: '48px' }}>
              <Link to="/shop" className="btn-outline">
                <span>View All Products</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section categories-section">
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">Browse By</p>
              <h2 className="section-title">Categories</h2>
              <div className="gold-line" />
            </div>
            <div className="categories-grid">
              {categories.map(cat => (
                <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="category-card">
                  <div className="category-card__image">
                    {cat.image
                      ? <img src={cat.image} alt={cat.name} />
                      : <div className="category-card__placeholder" />
                    }
                    <div className="category-card__overlay" />
                  </div>
                  <div className="category-card__info">
                    <h3>{cat.name}</h3>
                    <span>{cat.product_count} items</span>
                  </div>
                </Link>
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
            <Link to="/shop?type=preorder" className="btn-primary">
              <span>Browse Pre-orders</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
