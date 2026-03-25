import axios from "axios";

const PROD_BACKEND = "https://ai-quiz-plateform.onrender.com";

const resolveApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  if (typeof window !== "undefined") {
    const isLocalHost = ["localhost", "127.0.0.1"].includes(
      window.location.hostname,
    );
    if (isLocalHost) return "http://localhost:8000/api";
  }

  return `${PROD_BACKEND}/api`;
};

const axiosInstance = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const getCookieValue = (name) => {
  if (typeof document === "undefined") return null;
  const target = `${name}=`;
  const found = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(target));
  if (!found) return null;
  return decodeURIComponent(found.slice(target.length));
};

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token") || getCookieValue("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      document.cookie = "token=; path=/; max-age=0; samesite=lax";
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  },
);

// Central request helper used by all thunks
export const axiosRequest = async (method, url, body = null) => {
  const config = { method, url };
  if (body) config.data = body;
  const response = await axiosInstance(config);
  return response.data;
};

export default axiosInstance;
