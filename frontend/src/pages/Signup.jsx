import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, MessageCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  signupFail,
  signupRequest,
  signupSuccess,
  clearError,
} from "../Redux/feature/authSlice";

const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.authReducer);

  const [formData, setFormData] = useState({
    name: "",
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
    dispatch(signupRequest());

    try {
      const { data } = await axios.post(
        "http://localhost:4000/auth/signup",
        formData,
        {
          withCredentials: true,
        },
      );

      dispatch(
        signupSuccess({
          user: data.user,
          message: data.message,
        }),
      );

      navigate("/");
    } catch (err) {
      dispatch(
        signupFail(err.response?.data?.message || "Something went wrong"),
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-indigo-950 flex justify-center items-center px-6">
      <div className="w-full max-w-6xl bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl grid md:grid-cols-2">
        {/* Left */}

        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-indigo-600 to-purple-700 p-14">
          <MessageCircle size={110} className="text-white mb-8" />

          <h1 className="text-5xl font-bold text-white">ChatApp</h1>

          <p className="text-indigo-100 mt-5 text-center text-lg">
            Join thousands of users and start chatting instantly.
          </p>
        </div>

        {/* Right */}

        <div className="p-10 md:p-14">

          <h2 className="text-4xl font-bold text-white">Create Account 🚀</h2>

          <p className="text-zinc-400 mt-2">
            Signup to begin your conversation.
          </p>

          <form onSubmit={submitHandle} className="mt-10 space-y-6">
            <div className="flex items-center bg-zinc-800 rounded-xl px-4">
              <User className="text-zinc-400" />

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={changeHandle}
                placeholder="Full Name"
                required
                className="w-full bg-transparent p-4 outline-none text-white"
              />
            </div>

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
              {user.loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-8 text-zinc-400">
            Already have an account?
            <Link to="/login" className="text-indigo-400 ml-2">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
