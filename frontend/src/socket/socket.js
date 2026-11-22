import { io } from "socket.io-client";
import { BACKEND_URL } from "../config";

// Connect only once the user is logged in (Home calls socket.connect()).
// Connecting at import time on the login page fails auth (no cookie yet) and
// socket.io does not retry after a middleware rejection.
export const socket = io(BACKEND_URL, {
    withCredentials: true,
    autoConnect: false
});