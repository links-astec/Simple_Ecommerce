import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
});

API.interceptors.request.use((config) => {
  if ((config.method || 'get').toLowerCase() === 'get') {
    config.params = {
      ...(config.params || {}),
      _ts: Date.now(),
    };
    config.headers = {
      ...(config.headers || {}),
      'Cache-Control': 'no-cache, no-store, max-age=0',
      Pragma: 'no-cache',
    };
  }
  return config;
});

export const getCategories = () => API.get('/categories/');
export const getProducts = (params = {}) => API.get('/products/', { params });
export const getProduct = (slug) => API.get(`/products/${slug}/`);
export const getStats = () => API.get('/stats/');
export const createOrder = (data) => API.post('/orders/', data);
export const initializePayment = (orderId, callbackUrl) => API.post('/payment/initialize/', { order_id: orderId, callback_url: callbackUrl });
export const verifyPayment = (reference) => API.get('/payment/verify/', { params: { reference } });
export const getOrder = (reference) => API.get(`/orders/${reference}/`);
export const getSiteSettings = () => API.get('/settings/');

export default API;
