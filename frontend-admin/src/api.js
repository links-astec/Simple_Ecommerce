import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
});

export const getAdminToken = () => sessionStorage.getItem('bh_admin_token') || '';

API.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers = { ...(config.headers || {}), 'X-Admin-Key': token };
  }
  if ((config.method || 'get').toLowerCase() === 'get') {
    config.params = { ...(config.params || {}), _ts: Date.now() };
    config.headers = {
      ...(config.headers || {}),
      'Cache-Control': 'no-cache, no-store, max-age=0',
      Pragma: 'no-cache',
    };
  }
  return config;
});

export const adminLogin = (password) =>
  API.post('/admin/login/', { password });

export default API;
