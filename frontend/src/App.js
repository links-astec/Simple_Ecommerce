import React from 'react';
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

function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/manage');
  return (
    <>
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
