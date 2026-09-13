import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function Login() {
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("passenger");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  ========================================================
  NORMAL LOGIN
  ========================================================
  */

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          email: email.trim(),
          password,
          role,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const data = response.data;

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: data.role || role,
          })
        );
      }

      setSuccess("Login successful! Redirecting...");

      setTimeout(() => {
        if (data.user?.role === "rider" || role === "rider") {
          navigate("/rider-dashboard");
        } else {
          navigate("/passenger-dashboard");
        }
      }, 500);
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      if (err.code === "ECONNABORTED") {
        setError("Server took too long to respond.");
      } else if (
        err.code === "ERR_NETWORK" ||
        !err.response
      ) {
        setError(
          "Cannot connect to server. Please make sure the backend is running on port 5000."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Invalid email, password or role."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
  ========================================================
  GOOGLE LOGIN CALLBACK
  ========================================================
  */

  const handleGoogleResponse = async (response) => {
    setError("");
    setSuccess("");
    setGoogleLoading(true);

    try {
      if (!response?.credential) {
        throw new Error("Google did not return a valid credential.");
      }

      console.log("Google credential received.");

      /*
       * The backend will verify this Google ID token.
       *
       * IMPORTANT:
       * We do NOT decode or trust the Google user's
       * name/email on the frontend.
       */

      const result = await axios.post(
        `${API_URL}/auth/google`,
        {
          credential: response.credential,
          role,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const data = result.data;

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      /*
       * Backend may tell us that a new Google account
       * still needs a role.
       */

      if (data.needsRole) {
        setGoogleLoading(false);
        setError(
          "Please select Passenger or Rider and try Google Sign-In again."
        );
        return;
      }

      setSuccess("Google Sign-In successful! Redirecting...");

      setTimeout(() => {
        const loggedInRole =
          data.user?.role || role;

        if (
          String(loggedInRole).toLowerCase() === "rider"
        ) {
          navigate("/rider-dashboard");
        } else {
          navigate("/passenger-dashboard");
        }
      }, 500);
    } catch (err) {
      console.error("GOOGLE LOGIN ERROR:", err);

      if (err.code === "ECONNABORTED") {
        setError("Google Sign-In request timed out.");
      } else if (
        err.code === "ERR_NETWORK" ||
        !err.response
      ) {
        setError(
          "Cannot connect to the RideBack server."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Google Sign-In failed. Please try again."
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  /*
  ========================================================
  INITIALIZE GOOGLE IDENTITY SERVICES
  ========================================================
  */

  useEffect(() => {
    let interval;

    const initializeGoogle = () => {
      if (
        !window.google ||
        !window.google.accounts ||
        !window.google.accounts.id
      ) {
        return false;
      }

      if (!googleButtonRef.current) {
        return false;
      }

      const clientId =
        process.env.REACT_APP_GOOGLE_CLIENT_ID;

      if (!clientId) {
        console.error(
          "REACT_APP_GOOGLE_CLIENT_ID is missing from client/.env"
        );

        setError(
          "Google Sign-In is not configured correctly."
        );

        return true;
      }

      /*
       * Clear the container before rendering.
       */

      googleButtonRef.current.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });

      /*
       * Google's official Sign-In button.
       */

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: 400,
        }
      );

      return true;
    };

    if (!initializeGoogle()) {
      interval = setInterval(() => {
        if (initializeGoogle()) {
          clearInterval(interval);
        }
      }, 300);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [role]);

  return (
    <div className="rb-login-page">

      {/* Background decorations */}

      <div className="rb-bg-circle rb-bg-circle-1"></div>
      <div className="rb-bg-circle rb-bg-circle-2"></div>

      <div className="rb-login-container">

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="rb-login-info">

          <Link to="/" className="rb-brand">

            <div className="rb-brand-logo">
              R
            </div>

            <div>
              <div className="rb-brand-name">
                RideBack
              </div>

              <div className="rb-brand-subtitle">
                SMART JOURNEYS
              </div>
            </div>

          </Link>

          <div className="rb-info-content">

            <div className="rb-small-badge">
              <span className="rb-online-dot"></span>
              Smart transportation
            </div>

            <h1>
              Welcome back to
              <span> RideBack.</span>
            </h1>

            <p>
              Connect passengers with riders already travelling
              your way. Simple, affordable and smarter journeys.
            </p>

            <div className="rb-feature-list">

              <div className="rb-feature">

                <div className="rb-feature-icon">
                  📍
                </div>

                <div>
                  <strong>
                    Find nearby rides
                  </strong>

                  <p>
                    Discover available riders around you.
                  </p>
                </div>

              </div>

              <div className="rb-feature">

                <div className="rb-feature-icon">
                  ⚡
                </div>

                <div>
                  <strong>
                    Quick connection
                  </strong>

                  <p>
                    Connect with riders quickly.
                  </p>
                </div>

              </div>

              <div className="rb-feature">

                <div className="rb-feature-icon">
                  🛡️
                </div>

                <div>
                  <strong>
                    Simple & secure
                  </strong>

                  <p>
                    Separate passenger and rider experiences.
                  </p>
                </div>

              </div>

            </div>

          </div>
        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="rb-login-card-wrapper">

          <div className="rb-login-card">

            {/* Mobile logo */}

            <div className="rb-mobile-logo">

              <div className="rb-brand-logo">
                R
              </div>

              <div>
                <div className="rb-brand-name">
                  RideBack
                </div>

                <div className="rb-brand-subtitle">
                  SMART JOURNEYS
                </div>
              </div>

            </div>

            {/* Heading */}

            <div className="rb-login-heading">

              <h2>
                Welcome back
              </h2>

              <p>
                Sign in to continue to RideBack
              </p>

            </div>

            {/* Error */}

            {error && (
              <div className="rb-alert rb-alert-error">

                <span>
                  ⚠️
                </span>

                <span>
                  {error}
                </span>

              </div>
            )}

            {/* Success */}

            {success && (
              <div className="rb-alert rb-alert-success">

                <span>
                  ✓
                </span>

                <span>
                  {success}
                </span>

              </div>
            )}

            {/* =================================================
                LOGIN FORM
            ================================================= */}

            <form onSubmit={handleLogin}>

              {/* EMAIL */}

              <div className="rb-form-group">

                <label>
                  Email Address
                </label>

                <div className="rb-input-wrapper">

                  <span className="rb-input-icon">
                    ✉️
                  </span>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter your email"
                    autoComplete="email"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="rb-form-group">

                <div className="rb-label-row">

                  <label>
                    Password
                  </label>

                  <button
                    type="button"
                    className="rb-forgot-button"
                    onClick={() =>
                      navigate("/forgot-password")
                    }
                  >
                    Forgot password?
                  </button>

                </div>

                <div className="rb-input-wrapper">

                  <span className="rb-input-icon">
                    🔒
                  </span>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />

                </div>

              </div>

              {/* ROLE */}

              <div className="rb-form-group">

                <label>
                  Login As
                </label>

                <div className="rb-role-container">

                  {/* PASSENGER */}

                  <button
                    type="button"
                    className={
                      role === "passenger"
                        ? "rb-role active"
                        : "rb-role"
                    }
                    onClick={() =>
                      setRole("passenger")
                    }
                  >

                    <span className="rb-role-icon">
                      👤
                    </span>

                    <span>
                      <strong>
                        Passenger
                      </strong>

                      <small>
                        Find a ride
                      </small>
                    </span>

                    {role === "passenger" && (
                      <span className="rb-check">
                        ✓
                      </span>
                    )}

                  </button>

                  {/* RIDER */}

                  <button
                    type="button"
                    className={
                      role === "rider"
                        ? "rb-role active rider"
                        : "rb-role"
                    }
                    onClick={() =>
                      setRole("rider")
                    }
                  >

                    <span className="rb-role-icon">
                      🛵
                    </span>

                    <span>
                      <strong>
                        Rider
                      </strong>

                      <small>
                        Accept passengers
                      </small>
                    </span>

                    {role === "rider" && (
                      <span className="rb-check">
                        ✓
                      </span>
                    )}

                  </button>

                </div>

              </div>

              {/* NORMAL LOGIN BUTTON */}

              <button
                type="submit"
                className="rb-login-button"
                disabled={loading || googleLoading}
              >

                {loading ? (
                  <>
                    <span className="rb-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span>→</span>
                  </>
                )}

              </button>

            </form>

            {/* =================================================
                DIVIDER
            ================================================= */}

            <div className="rb-login-divider">

              <span></span>

              <div>
                OR
              </div>

              <span></span>

            </div>

            {/* =================================================
                REAL GOOGLE SIGN-IN
            ================================================= */}

            <div className="rb-google-section">

              <div className="rb-google-heading">
                Sign in securely with Google
              </div>

              {googleLoading && (
                <div className="rb-google-status">
                  <span className="rb-google-spinner"></span>
                  Connecting to Google...
                </div>
              )}

              <div
                ref={googleButtonRef}
                className="rb-google-official-button"
              ></div>

            </div>

            {/* REGISTER */}

            <div className="rb-register-text">

              Don't have an account?

              <Link to="/register">
                Create account
              </Link>

            </div>

            {/* SECURITY */}

            <div className="rb-security">
              🔒 Your information is securely protected
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          GOOGLE / FORGOT PASSWORD STYLES
      ===================================================== */}

      <style>{`

        .rb-forgot-button {
          background: none;
          border: none;
          padding: 0;
          margin: 0;

          color: #2563eb;

          font-size: 13px;
          font-weight: 600;

          cursor: pointer;
        }

        .rb-forgot-button:hover {
          text-decoration: underline;
        }

        .rb-login-divider {
          display: flex;
          align-items: center;
          gap: 12px;

          margin: 22px 0;
        }

        .rb-login-divider span {
          flex: 1;
          height: 1px;

          background: #e2e8f0;
        }

        .rb-login-divider div {
          color: #94a3b8;

          font-size: 12px;

          font-weight: 700;

          letter-spacing: 1px;
        }

        .rb-google-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .rb-google-heading {
          margin-bottom: 10px;

          color: #64748b;

          font-size: 12px;

          font-weight: 600;

          text-align: center;
        }

        .rb-google-official-button {
          width: 100%;
          min-height: 44px;

          display: flex;
          justify-content: center;
          align-items: center;
        }

        .rb-google-status {
          display: flex;
          align-items: center;
          justify-content: center;

          gap: 8px;

          margin-bottom: 8px;

          color: #2563eb;

          font-size: 13px;

          font-weight: 600;
        }

        .rb-google-spinner {
          width: 16px;
          height: 16px;

          border: 2px solid #dbeafe;
          border-top-color: #2563eb;

          border-radius: 50%;

          animation: rbGoogleSpin 0.8s linear infinite;
        }

        @keyframes rbGoogleSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 500px) {

          .rb-google-official-button {
            overflow: hidden;
          }

        }

      `}</style>

    </div>
  );
}