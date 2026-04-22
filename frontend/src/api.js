import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
});

export const getCategories = () => API.get('/categories/');
export const getProducts = (params = {}) => API.get('/products/', { params });
export const getProduct = (slug) => API.get(`/products/${slug}/`);
export const getStats = () => API.get('/stats/');
export const createOrder = (data) => API.post('/orders/', data);
export const initializePayment = (orderId) => API.post('/payment/initialize/', { order_id: orderId });
export const verifyPayment = (reference) => API.get('/payment/verify/', { params: { reference } });
export const getOrder = (reference) => API.get(`/orders/${reference}/`);

export default API;
