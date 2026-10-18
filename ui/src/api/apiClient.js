import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from '../auth/tokenStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (
      err.response?.status === 401 &&
      !originalRequest._retry &&
      !['/auth/login', '/auth/signup', '/auth/refresh'].some((path) => originalRequest.url.includes(path))
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push({ reject, resolve: (token) => {
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.get('/auth/refresh', {
          baseURL: apiClient.defaults.baseURL,
          withCredentials: true,
        });
        setAccessToken(data.accessToken);

        onRefreshed(data.accessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearAccessToken();
        refreshSubscribers.forEach(({ reject }) => reject(refreshError));
        refreshSubscribers = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default apiClient;
