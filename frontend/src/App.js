import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentVerifyPage from './pages/PaymentVerifyPage';
import OrderConfirmPage from './pages/OrderConfirmPage';
import AdminPage from './pages/AdminPage';

function RouteMetadata() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/manage');

  useEffect(() => {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const description = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');

    if (manifestLink) {
      manifestLink.setAttribute('href', isAdmin ? '/manage.webmanifest' : '/manifest.json');
    }
    if (themeColor) {
      themeColor.setAttribute('content', isAdmin ? '#111111' : '#b8892a');
    }
    if (appleTitle) {
      appleTitle.setAttribute('content', isAdmin ? 'Bel\'s Haven Admin' : 'Bel\'s Haven');
    }
    if (description) {
      description.setAttribute(
        'content',
        isAdmin
          ? 'Bel\'s Haven admin dashboard for managing products, categories, and orders.'
          : 'Bel\'s Haven - Curated fashion, beauty & accessories delivered with love.'
      );
    }
    if (ogTitle) {
      ogTitle.setAttribute('content', isAdmin ? 'Bel\'s Haven Admin' : 'Bel\'s Haven');
    }
    if (ogDescription) {
      ogDescription.setAttribute(
        'content',
        isAdmin
          ? 'Manage products, categories, and orders from the Bel\'s Haven dashboard.'
          : 'Curated fashion, beauty & accessories.'
      );
    }

    document.title = isAdmin ? 'Bel\'s Haven Admin' : 'Bel\'s Haven';
  }, [isAdmin]);

  return null;
}

function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/manage');
  return (
    <>
      <RouteMetadata />
      {!isAdmin && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment/verify" element={<PaymentVerifyPage />} />
          <Route path="/order/:reference" element={<OrderConfirmPage />} />
          <Route path="/manage/*" element={<AdminPage />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#141414',
              color: '#f0ebe2',
              border: '1px solid #1e1e1e',
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.85rem',
              borderRadius: '2px',
            },
          }}
        />
        <Layout />
      </Router>
    </CartProvider>
  );
}
