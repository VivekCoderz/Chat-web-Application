import { io } from "socket.io-client";
import api from "../config";

export const socket = io("https://nexachat-backend-akdr.onrender.com",{
    withCredentials : true
});