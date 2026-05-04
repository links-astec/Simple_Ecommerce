import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '../CartContext';
import './Navbar.css';

export default function Navbar() {
  const { totalItems } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <button className="navbar__menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-text">Bel's Haven</span>
          <span className="navbar__logo-sub">curated luxury</span>
        </Link>

        <nav className="navbar__links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/shop" className={location.pathname.startsWith('/shop') ? 'active' : ''}>Shop</Link>
          <Link to="/shop?type=available">Available</Link>
          <Link to="/shop?type=preorder">Pre-order</Link>
          <Link to="/track-order" className={location.pathname === '/track-order' ? 'active' : ''}>Track Order</Link>
        </nav>

        <Link to="/cart" className="navbar__cart">
          <ShoppingBag size={20} />
          {totalItems > 0 && <span className="navbar__cart-count">{totalItems}</span>}
        </Link>
      </div>

      {/* Mobile menu */}
      <div className={`navbar__mobile ${menuOpen ? 'navbar__mobile--open' : ''}`}>
        <Link to="/">Home</Link>
        <Link to="/shop">Shop All</Link>
        <Link to="/shop?type=available">Available Now</Link>
        <Link to="/shop?type=preorder">Pre-order</Link>
        <Link to="/track-order">Track Order</Link>
        <Link to="/cart">Cart {totalItems > 0 && `(${totalItems})`}</Link>
      </div>
    </nav>
  );
}
