import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Login.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/users/forgot-password", {
        email,
      });

      setMessage(
        response.data.message ||
          "Password reset link has been sent to your email.",
      );
    } catch (err) {
      console.error("Forgot password error:", err);

      setError(
        err.response?.data?.errorMessage ||
          "Failed to send password reset email.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Forgot Password?</h2>

      {message && <div className="success-message">{message}</div>}

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

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div className="signup-link-container">
        <span className="signup-link" onClick={() => navigate("/login")}>
          ← Back to Login
        </span>
      </div>
    </div>
  );
}

export default ForgotPassword;
