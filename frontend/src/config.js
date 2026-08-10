import axios from "axios";

const api = axios.create({
//   baseURL: "https://nexachat-backend-akdr.onrender.com",
  baseURL : "http://localhost:4000", 
  withCredentials: true,
    headers: {
    "Content-Type": "application/json",
  },
});


export default api;
