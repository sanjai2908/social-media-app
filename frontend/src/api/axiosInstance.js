import axios from "axios";

const api = axios.create({
  baseURL:process.env.REACT_APP_API_URL || "http://localhost:5000/api", // fallback for local dev
});

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
