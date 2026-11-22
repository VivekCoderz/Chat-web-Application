import axios from "axios";

export const BACKEND_URL = "http://localhost:4000"; // Mode toggle: Change here to switch URL everywhere!

const api = axios.create({
  baseURL: BACKEND_URL, 
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
