import React from 'react';
import { Toaster } from 'react-hot-toast';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <>
      <AdminPage />
      <Toaster position="bottom-center" toastOptions={{ className: 'toast-dark', duration: 3000 }} />
    </>
  );
}
