import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const roleFromUrl = searchParams.get("role");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState(
    roleFromUrl === "rider" ? "rider" : "passenger"
  );

  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !phone || !password) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/register", {
        name,
        email,
        phone,
        password,
        role,
      });

      alert(
        res.data.message ||
        "Registration successful!"
      );

      navigate("/login");

    } catch (error) {
      console.error("Registration error:", error);

      alert(
        error.response?.data?.message ||
        "Registration failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* =====================================================
          LEFT PANEL
      ===================================================== */}

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-950" />

        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-300/20 rounded-full blur-3xl" />

        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-teal-300/20 rounded-full blur-3xl" />


        <div className="relative z-10 p-12 xl:p-16 text-white flex flex-col justify-between w-full">

          {/* Logo */}

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl font-extrabold">
              S
            </div>

            <div>

              <h1 className="text-2xl font-extrabold">
                Smart Ride
              </h1>

              <p className="text-sm text-emerald-100">
                Smarter journeys. Better returns.
              </p>

            </div>

          </div>


          {/* Main content */}

          <div className="max-w-xl">

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold">

              <span className="w-2 h-2 bg-emerald-300 rounded-full" />

              Join Smart Ride

            </div>


            <h2 className="text-5xl xl:text-6xl font-extrabold leading-tight mt-6">

              Start your
              <br />
              smarter journey.

            </h2>


            <p className="text-lg text-emerald-100 mt-6 leading-relaxed max-w-lg">

              Whether you're looking for a ride or want to
              earn more on your return journey, Smart Ride
              connects you with the right people.

            </p>


            {/* Benefits */}

            <div className="space-y-4 mt-10">

              <div className="flex items-center gap-4">

                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  ✓
                </div>

                <div>

                  <p className="font-bold">
                    Simple & Fast
                  </p>

                  <p className="text-sm text-emerald-200">
                    Book or offer rides in seconds.
                  </p>

                </div>

              </div>


              <div className="flex items-center gap-4">

                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  ✓
                </div>

                <div>

                  <p className="font-bold">
                    Smart Matching
                  </p>

                  <p className="text-sm text-emerald-200">
                    Connect with people travelling your way.
                  </p>

                </div>

              </div>


              <div className="flex items-center gap-4">

                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  ✓
                </div>

                <div>

                  <p className="font-bold">
                    Built for Efficiency
                  </p>

                  <p className="text-sm text-emerald-200">
                    Make every journey count.
                  </p>

                </div>

              </div>

            </div>

          </div>


          <p className="text-sm text-emerald-200">
            © 2026 Smart Ride
          </p>

        </div>

      </div>


      {/* =====================================================
          RIGHT PANEL
      ===================================================== */}

      <div className="flex-1 bg-slate-50 flex items-center justify-center p-6">

        <div className="w-full max-w-md">

          {/* Mobile Logo */}

          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">

            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-extrabold">
              S
            </div>

            <div>

              <h1 className="text-2xl font-extrabold text-slate-900">
                Smart Ride
              </h1>

              <p className="text-xs text-slate-400">
                Smarter journeys
              </p>

            </div>

          </div>


          {/* Card */}

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-7 sm:p-9">

            {/* Heading */}

            <div className="mb-7">

              <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider">
                Create account
              </p>

              <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
                Join Smart Ride
              </h2>

              <p className="text-slate-400 mt-2">
                Create your account and get started.
              </p>

            </div>


            {/* Role */}

            <div className="mb-6">

              <label className="block text-sm font-bold text-slate-700 mb-3">
                I want to use Smart Ride as
              </label>


              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() => setRole("passenger")}
                  className={`p-4 rounded-xl border-2 transition text-left ${
                    role === "passenger"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >

                  <div className="text-2xl">
                    👤
                  </div>

                  <p className="font-bold text-slate-800 mt-2">
                    Passenger
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Find a ride
                  </p>

                </button>


                <button
                  type="button"
                  onClick={() => setRole("rider")}
                  className={`p-4 rounded-xl border-2 transition text-left ${
                    role === "rider"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >

                  <div className="text-2xl">
                    🛵
                  </div>

                  <p className="font-bold text-slate-800 mt-2">
                    Rider
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Offer a ride
                  </p>

                </button>

              </div>

            </div>


            {/* FORM */}

            <form
              onSubmit={handleRegister}
              className="space-y-4"
            >

              {/* Name */}

              <div>

                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Full Name
                </label>

                <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition">

                  <span>
                    👤
                  </span>

                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    className="w-full outline-none text-slate-800 placeholder:text-slate-300"
                  />

                </div>

              </div>


              {/* Email */}

              <div>

                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Email Address
                </label>

                <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition">

                  <span>
                    ✉️
                  </span>

                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="w-full outline-none text-slate-800 placeholder:text-slate-300"
                  />

                </div>

              </div>


              {/* Phone */}

              <div>

                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Phone Number
                </label>

                <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition">

                  <span>
                    📱
                  </span>

                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    className="w-full outline-none text-slate-800 placeholder:text-slate-300"
                  />

                </div>

              </div>


              {/* Password */}

              <div>

                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Password
                </label>

                <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition">

                  <span>
                    🔒
                  </span>

                  <input
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="w-full outline-none text-slate-800 placeholder:text-slate-300"
                  />

                </div>

              </div>


              {/* Submit */}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-emerald-100 mt-2"
              >

                {loading
                  ? "Creating Account..."
                  : "Create Account →"}

              </button>

            </form>


            {/* Login */}

            <div className="text-center mt-7">

              <p className="text-sm text-slate-400">

                Already have an account?{" "}

                <button
                  onClick={() => navigate("/login")}
                  className="text-emerald-600 font-bold hover:text-emerald-700"
                >
                  Sign in
                </button>

              </p>

            </div>


            {/* Back */}

            <button
              onClick={() => navigate("/choose-role")}
              className="w-full mt-5 text-sm text-slate-400 hover:text-slate-700 transition"
            >
              ← Change role
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}