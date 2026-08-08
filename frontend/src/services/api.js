import axios from "axios";
const API_BASE_URL = process.env.REACT_APP_API_URL;
// const API_BASE_URL = `https://${hostname}`;
console.log("API Base URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - automatically attach token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle token expiration and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized (token expired or invalid)
    // Only redirect if user was logged in (has token) - this means token expired
    // Don't redirect on login failures (no token yet)
    if (error.response?.status === 401 && localStorage.getItem("token")) {
      // Clear authentication data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Questions API
export const questionAPI = {
  getAll: (params) => api.get("/questions", { params }),
  search: (params) => api.get("/questions/search", { params }),
};

// Categories API
export const categoryAPI = {
  getAll: () => api.get("/categories"),
};

// Users API (for admin)
export const userAPI = {
  getAll: () => api.get("/users"),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post("/users", userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  register: (userData) => api.post("/users/register", userData),
};

export default api;
