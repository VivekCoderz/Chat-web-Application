import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import {
    clearError,
  clearMessage,
  loadUserFail,
  loadUserRequest,
  loadUserSuccess,
} from "./Redux/feature/authSlice";
import ProtectedRoute from "./components/ProtectedRoute";
import MessageAlert from "./components/MessageAlert.jsx"
import api from "./config.js";

const App = () => {
    const { error, message } = useSelector((store) => store.authReducer);
    const dispatch = useDispatch();
  useEffect(() => {
    const fetchUser = async () => {
      dispatch(loadUserRequest());
      try {
        const { data } = await api.get("/auth/me", {
          withCredentials: true,
        });

        dispatch(loadUserSuccess(data.user));
      } catch (err) {
        dispatch(
          loadUserFail(err.response?.data?.message || "Something went wrong"),
        );
      }
    };
    fetchUser();
  }, []);
  return (
    <>
      {error && <MessageAlert message={error} type="error" clearMessage={() => dispatch(clearError())} />}

      {message && <MessageAlert message={message} type="success" clearMessage={() => dispatch(clearMessage())} />}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
