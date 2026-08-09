import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./feature/authSlice.js";
import generalCharReducer from "./feature/generalChatSlice.js"
import onlineUsersReducer from "./feature/onlineUsersSlice.js"
const store = configureStore({
  reducer: {
    authReducer: authReducer,
    generalCharReducer : generalCharReducer,
    onlineUsers: onlineUsersReducer,
  },
});

export default store;
