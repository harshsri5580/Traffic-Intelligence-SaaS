import axios from "axios";

// ✅ Clean base URL (no trailing slash)
const cleanURL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

const baseURL = cleanURL
  ? `${cleanURL}/api`
  : "http://127.0.0.1:8000/api";

// ✅ Axios instance
const api = axios.create({
  baseURL,
  timeout: 30000,
});


// ===============================
// 🔐 REQUEST INTERCEPTOR (SAFE)
// ===============================
api.interceptors.request.use(
  (config) => {

    // ✅ ensure headers exists
    config.headers = config.headers || {};

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      // ✅ attach only if valid
      if (token && token !== "null" && token !== "undefined") {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// ===============================
// 🚨 RESPONSE INTERCEPTOR (SAFE)
// ===============================
api.interceptors.response.use(
  (response) => response,

  (error) => {

    // ✅ NETWORK ERROR (server down / no internet)
    if (!error.response) {
      console.error("Network error or server not reachable");
      return Promise.reject(error);
    }

    // 🔐 UNAUTHORIZED (401)
    if (
      typeof window !== "undefined" &&
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