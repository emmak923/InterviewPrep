import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/users/login", {
        email,
        password,
      });

      // Store email temporarily for OTP verification
      sessionStorage.setItem("tempEmail", email);

      alert(response.data.message || "OTP sent to your email");

      // Redirect to OTP verification page
      navigate("/verify-otp");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.errorMessage || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Login</h1>

      {error && <div className="login-error">{error}</div>}

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
          />
        </div>

        <div className="forgot-password-container">
          {" "}
          <span
            className="forgot-password-link"
            onClick={() => navigate("/forgot-password")}
          >
            {" "}
            Forgot Password?{" "}
          </span>{" "}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Sending OTP..." : "Login"}
        </button>
      </form>
      <div className="signup-link-container">
        New user?{" "}
        <span className="signup-link" onClick={() => navigate("/signup")}>
          Create an account
        </span>
      </div>
    </div>
  );
}

export default Login;
