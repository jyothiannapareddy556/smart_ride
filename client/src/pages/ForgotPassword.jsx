import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        {
          email: email.trim(),
        }
      );

      setMessage(
        response.data.message ||
          "If an account exists with this email, a password reset link has been sent."
      );

      setEmail("");

    } catch (err) {

      console.error("FORGOT PASSWORD ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to process your request. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.card}>

        <div style={styles.logo}>
          🚗
        </div>

        <h1 style={styles.title}>
          Forgot Password?
        </h1>

        <p style={styles.subtitle}>
          Don't worry. Enter your registered email and
          we'll send you a link to reset your password.
        </p>


        {message && (
          <div style={styles.success}>
            ✓ {message}
          </div>
        )}


        {error && (
          <div style={styles.error}>
            ⚠ {error}
          </div>
        )}


        <form onSubmit={handleSubmit}>

          <label style={styles.label}>
            Email Address
          </label>

          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            disabled={loading}
          />


          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading
              ? "Sending..."
              : "Send Reset Link"}
          </button>

        </form>


        <button
          onClick={() => navigate("/login")}
          style={styles.backButton}
        >
          ← Back to Login
        </button>

      </div>

    </div>
  );
};


const styles = {

  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",

    background:
      "linear-gradient(135deg, #0f172a, #1d4ed8, #06b6d4)",
  },

  card: {
    width: "100%",
    maxWidth: "450px",

    background: "rgba(255,255,255,0.97)",

    padding: "40px",

    borderRadius: "24px",

    boxShadow:
      "0 25px 60px rgba(0,0,0,0.25)",

    textAlign: "center",
  },

  logo: {
    width: "70px",
    height: "70px",

    margin: "0 auto 20px",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    borderRadius: "20px",

    background:
      "linear-gradient(135deg, #2563eb, #06b6d4)",

    fontSize: "35px",

    boxShadow:
      "0 10px 25px rgba(37,99,235,0.3)",
  },

  title: {
    margin: "0 0 10px",

    fontSize: "30px",

    fontWeight: "800",

    color: "#0f172a",
  },

  subtitle: {
    marginBottom: "28px",

    color: "#64748b",

    fontSize: "15px",

    lineHeight: "1.6",
  },

  label: {
    display: "block",

    textAlign: "left",

    marginBottom: "8px",

    color: "#334155",

    fontWeight: "600",
  },

  input: {
    width: "100%",

    boxSizing: "border-box",

    padding: "14px 16px",

    borderRadius: "12px",

    border: "2px solid #e2e8f0",

    outline: "none",

    fontSize: "15px",

    marginBottom: "18px",
  },

  button: {
    width: "100%",

    border: "none",

    padding: "15px",

    borderRadius: "12px",

    background:
      "linear-gradient(135deg, #2563eb, #06b6d4)",

    color: "white",

    fontSize: "16px",

    fontWeight: "700",

    cursor: "pointer",

    boxShadow:
      "0 8px 20px rgba(37,99,235,0.3)",
  },

  backButton: {
    marginTop: "22px",

    background: "transparent",

    border: "none",

    color: "#2563eb",

    fontSize: "14px",

    fontWeight: "600",

    cursor: "pointer",
  },

  success: {
    marginBottom: "20px",

    padding: "14px",

    borderRadius: "12px",

    background: "#ecfdf5",

    color: "#047857",

    border: "1px solid #a7f3d0",

    fontSize: "14px",

    lineHeight: "1.5",
  },

  error: {
    marginBottom: "20px",

    padding: "14px",

    borderRadius: "12px",

    background: "#fef2f2",

    color: "#b91c1c",

    border: "1px solid #fecaca",

    fontSize: "14px",
  },

};


export default ForgotPassword;