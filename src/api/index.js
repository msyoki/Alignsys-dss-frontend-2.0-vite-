// Centralized Axios instance and API endpoints
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // You can add headers or interceptors here
});

// Example API methods
export const login = (credentials) => API.post('/login', credentials);
export const fetchUser = () => API.get('/user');
// Add more endpoints as needed

API.interceptors.response.use(
  response => response,
  error => {
    // Centralized error handling
    return Promise.reject(error);
  }
);

export default API;
