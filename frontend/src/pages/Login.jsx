import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Mail, Lock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  loginFail,
  loginRequest,
  loginSuccess,
  clearError,
} from "../Redux/feature/authSlice";
import api from "../config";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.authReducer);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const changeHandle = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const submitHandle = async (e) => {
    e.preventDefault();

    dispatch(clearError());
    dispatch(loginRequest());

    try {
      const { data } = await api.post("/auth/login", formData);

      dispatch(
        loginSuccess({
          user: data.user,
          message: data.message,
        }),
      );
      setTimeout(() => {
        navigate("/");
      }, 2000);
      navigate("/");
    } catch (err) {
      dispatch(
        loginFail(err.response?.data?.message || "Something went wrong"),
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-indigo-950 flex items-center justify-center px-6">
      <div className="w-full max-w-6xl bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl grid md:grid-cols-2">
        {/* Left Section */}

        <div className="hidden md:flex flex-col justify-center items-center p-14 bg-gradient-to-br from-indigo-600 to-purple-700">
          <MessageCircle size={110} className="text-white mb-8" />

          <h1 className="text-5xl font-bold text-white">ChatApp</h1>

          <p className="text-indigo-100 mt-5 text-center text-lg leading-8">
            Connect instantly with friends and teams. Secure messaging with
            real-time communication.
          </p>
        </div>

        {/* Right Section */}

        <div className="p-10 md:p-14">
          <h2 className="text-4xl font-bold text-white">Welcome Back 👋</h2>

          <p className="text-zinc-400 mt-2">Login to continue chatting.</p>

          <form onSubmit={submitHandle} className="mt-10 space-y-6">
            <div className="flex items-center bg-zinc-800 rounded-xl px-4">
              <Mail className="text-zinc-400" />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={changeHandle}
                placeholder="Email"
                required
                className="w-full bg-transparent p-4 outline-none text-white"
              />
            </div>

            <div className="flex items-center bg-zinc-800 rounded-xl px-4">
              <Lock className="text-zinc-400" />

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={changeHandle}
                placeholder="Password"
                required
                className="w-full bg-transparent p-4 outline-none text-white"
              />
            </div>

            <button
              disabled={user.loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 transition py-4 rounded-xl font-semibold text-white disabled:opacity-50"
            >
              {user.loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-8 text-zinc-400">
            Don't have an account?
            <Link
              to="/signup"
              className="text-indigo-400 ml-2 hover:text-indigo-300"
            >
              Signup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
