import axios from "axios";

// `npm run dev` talks to the local backend; production builds (Vercel) use the hosted API.
export const BACKEND_URL = import.meta.env.DEV
  ? "http://localhost:4000"
  : "https://nexachat-backend-akdr.onrender.com";

const api = axios.create({
  baseURL: BACKEND_URL, 
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
