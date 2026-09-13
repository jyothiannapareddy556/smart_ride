import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">

      <div className="max-w-7xl mx-auto px-6 py-4">

        <div className="flex items-center justify-between">

          {/* Logo */}

          <Link
            to="/"
            className="flex items-center gap-3"
          >

            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-lg">
              S
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Smart Ride
              </h1>

              <p className="text-xs text-slate-500">
                Ride smarter. Travel better.
              </p>
            </div>

          </Link>

          {/* Navigation */}

          <div className="hidden md:flex items-center gap-8">

            <Link
              to="/"
              className="text-slate-600 hover:text-blue-600 font-medium transition"
            >
              Home
            </Link>

            {user && (
              <>
                <Link
                  to={
                    user.role === "rider"
                      ? "/rider/dashboard"
                      : "/passenger/dashboard"
                  }
                  className="text-slate-600 hover:text-blue-600 font-medium transition"
                >
                  Dashboard
                </Link>

                <Link
                  to="/history"
                  className="text-slate-600 hover:text-blue-600 font-medium transition"
                >
                  Ride History
                </Link>

                <Link
                  to="/profile"
                  className="text-slate-600 hover:text-blue-600 font-medium transition"
                >
                  Profile
                </Link>
              </>
            )}

          </div>

          {/* Right side */}

          <div className="flex items-center gap-3">

            {user ? (
              <>
                <div className="hidden sm:block text-right">

                  <p className="text-sm font-semibold text-slate-900">
                    {user.name}
                  </p>

                  <p className="text-xs text-slate-500 capitalize">
                    {user.role}
                  </p>

                </div>

                <button
                  onClick={logout}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-800 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:block px-4 py-2 text-slate-700 font-semibold hover:text-blue-600 transition"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md"
                >
                  Get Started
                </Link>
              </>
            )}

          </div>

        </div>

      </div>

    </nav>
  );
}