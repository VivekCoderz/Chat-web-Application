import { io } from "socket.io-client";
import api from "../config";


const hostedServer = "https://nexachat-backend-akdr.onrender.com"
const localServer = "http://localhost:4000"
export const socket = io(hostedServer,{
    withCredentials : true
});