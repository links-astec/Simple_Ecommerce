import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
});

API.interceptors.request.use((config) => {
  return config;
});

const _cache = {};
const CACHE_TTL = 120000;

function cachedGet(key, fetcher) {
  const entry = _cache[key];
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    fetcher().then(res => { _cache[key] = { data: res, ts: Date.now() }; }).catch(() => {});
    return Promise.resolve(entry.data);
  }
  return fetcher().then(res => { _cache[key] = { data: res, ts: Date.now() }; return res; });
}

export const getCategories = () => cachedGet('categories', () => API.get('/categories/'));
export const getProducts = (params = {}) => {
  const key = 'products_' + JSON.stringify(params);
  return cachedGet(key, () => API.get('/products/', { params }));
};
export const getProduct = (slug) => cachedGet('product_' + slug, () => API.get(`/products/${slug}/`));
export const getStats = () => API.get('/stats/');
export const createOrder = (data) => API.post('/orders/', data);
export const initializePayment = (orderId, callbackUrl) => API.post('/payment/initialize/', { order_id: orderId, callback_url: callbackUrl });
export const verifyPayment = (reference) => API.get('/payment/verify/', { params: { reference } });
export const getOrder = (reference) => API.get(`/orders/${reference}/`);
export const sendOrderLookupCode = (email) => API.post('/orders/lookup/', { action: 'send_code', email });
export const verifyOrderLookupCode = (email, code) => API.post('/orders/lookup/', { action: 'verify', email, code });
export const getSiteSettings = () => cachedGet('settings', () => API.get('/settings/'));

export function invalidateCache(prefix) {
  if (prefix) {
    for (const k of Object.keys(_cache)) {
      if (k.startsWith(prefix)) delete _cache[k];
    }
  } else {
    for (const k of Object.keys(_cache)) delete _cache[k];
  }
}

export default API;
