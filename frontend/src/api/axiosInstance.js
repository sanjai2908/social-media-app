import axios from "axios";

// Choose baseURL depending on environment
const api = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL     // Production (Vercel)
      : "http://localhost:5000",          // Development
});

// Attach Authorization token if present
api.interceptors.request.use((config) => {
  const auth = localStorage.getItem("auth");

  if (auth) {
    const { token } = JSON.parse(auth);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default api;
