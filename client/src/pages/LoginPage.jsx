// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config";
import { User, Lock } from "lucide-react";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}/api/login`, { username, password });
      const { token, role, username: returnedUsername } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      if (role === "admin") navigate("/admin");
      else if (role === "operator") navigate("/operator", { state: { username: returnedUsername } });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
   <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 p-6">
  <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/40">
    <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
      Welcome Back
    </h2>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm text-center">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Username"
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 active:scale-95 transition-all shadow"
          >
            Login
          </button>
        </form>
        <p className="text-center text-sm text-blue-700 mt-6">
          Don’t have an account? <span className="font-medium">Contact Admin</span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
