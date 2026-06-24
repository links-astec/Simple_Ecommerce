import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MaintenancePage from './pages/MaintenancePage';
import { getSiteSettings } from './api';

const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const PaymentVerifyPage = lazy(() => import('./pages/PaymentVerifyPage'));
const OrderConfirmPage = lazy(() => import('./pages/OrderConfirmPage'));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage'));

function PageLoader() {
  return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} /></div>;
}

function Layout() {
  useEffect(() => {
    document.title = "Bel's Haven";
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/:slug" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment/verify" element={<PaymentVerifyPage />} />
            <Route path="/order/:reference" element={<OrderConfirmPage />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    getSiteSettings()
      .then(r => { if (r.data.maintenance) setMaintenance(true); })
      .catch(() => {});
  }, []);

  if (maintenance) return <MaintenancePage />;

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
