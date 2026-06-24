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
  return config;
});

export const adminLogin = (password) =>
  API.post('/admin/login/', { password });

export default API;
