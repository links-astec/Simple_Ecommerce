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

export default API;
