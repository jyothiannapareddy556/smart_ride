import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!token) {
      setError("Invalid password reset link.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        {
          token,
          password,
        }
      );

      setMessage(
        response.data.message ||
          "Password reset successful. You can now login."
      );

      setPassword("");
      setConfirmPassword("");

    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to reset password. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.card}>

        <div style={styles.logo}>
          🔐
        </div>

        <h1 style={styles.title}>
          Reset Password
        </h1>

        <p style={styles.subtitle}>
          Create a new password for your RideBack account.
        </p>

        {message && (
          <div style={styles.success}>
            ✓ {message}

            <button
              onClick={() => navigate("/login")}
              style={styles.loginButton}
            >
              Go to Login
            </button>
          </div>
        )}

        {error && (
          <div style={styles.error}>
            ⚠ {error}
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit}>

            <label style={styles.label}>
              New Password
            </label>

            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
            />

            <label style={styles.label}>
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              style={styles.input}
              disabled={loading}
            />

            <div style={styles.requirement}>
              Password must contain at least 6 characters.
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? "Resetting Password..."
                : "Reset Password"}
            </button>

          </form>
        )}

        {!message && (
          <button
            onClick={() => navigate("/login")}
            style={styles.backButton}
          >
            ← Back to Login
          </button>
        )}

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

    fontSize: "32px",

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

  requirement: {
    textAlign: "left",

    fontSize: "12px",

    color: "#64748b",

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
    padding: "18px",

    borderRadius: "12px",

    background: "#ecfdf5",

    color: "#047857",

    border: "1px solid #a7f3d0",

    fontSize: "14px",

    lineHeight: "1.5",
  },

  loginButton: {
    display: "block",

    width: "100%",

    marginTop: "15px",

    padding: "12px",

    border: "none",

    borderRadius: "10px",

    background: "#2563eb",

    color: "white",

    fontWeight: "700",

    cursor: "pointer",
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


export default ResetPassword;