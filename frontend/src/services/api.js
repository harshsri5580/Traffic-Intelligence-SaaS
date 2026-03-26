import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api",
  timeout: 30000,
});


// ✅ Request interceptor (safe)
api.interceptors.request.use(
  (config) => {

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor (safe)
api.interceptors.response.use(
  (response) => response,

  (error) => {

    if (
      typeof window !== "undefined" &&
      error.response &&
      error.response.status === 401
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;