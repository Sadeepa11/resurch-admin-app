import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://api.innlaunch.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 20000,
});

let onAuthError = null;
export const setOnAuthError = (cb) => {
  onAuthError = cb;
};

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    console.log("Request to:", config.url, "Has Token:", !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.url !== "/login" && onAuthError) {
      console.log("No token found for protected route, triggering auth error");
      onAuthError();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== "/login" && onAuthError) {
      console.log("Session expired or invalid (401), triggering auth error");
      onAuthError();
    }
    if (__DEV__) {
      console.warn("API Error:", error.response?.status, error.config?.url);
    }
    return Promise.reject(error);
  }
);

export const apiBase = API_BASE_URL.replace(/\/api$/, "");

export default api;
