import { useNavigate } from "react-router-dom";

export default function ChooseRole() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">

      <div className="w-full max-w-5xl">

        {/* Logo */}

        <div className="text-center mb-10">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white text-2xl font-extrabold shadow-lg">
            S
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-5">
            Welcome to Smart Ride
          </h1>

          <p className="text-slate-400 mt-2">
            Choose how you want to use Smart Ride
          </p>

        </div>


        {/* Role Cards */}

        <div className="grid md:grid-cols-2 gap-6">

          {/* Passenger */}

          <button
            onClick={() => navigate("/register?role=passenger")}
            className="group text-left bg-white rounded-3xl p-8 hover:-translate-y-2 transition duration-300 shadow-xl"
          >

            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl group-hover:bg-blue-100">
              👤
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mt-6">
              I'm a Passenger
            </h2>

            <p className="text-slate-500 mt-3 leading-relaxed">
              Find riders travelling in your direction and
              book an affordable ride.
            </p>

            <div className="mt-7 text-blue-600 font-bold">
              Continue as Passenger →
            </div>

          </button>


          {/* Rider */}

          <button
            onClick={() => navigate("/register?role=rider")}
            className="group text-left bg-white rounded-3xl p-8 hover:-translate-y-2 transition duration-300 shadow-xl"
          >

            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl group-hover:bg-emerald-100">
              🛵
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mt-6">
              I'm a Rider
            </h2>

            <p className="text-slate-500 mt-3 leading-relaxed">
              Complete your delivery and earn additional income
              by carrying passengers on your return journey.
            </p>

            <div className="mt-7 text-emerald-600 font-bold">
              Continue as Rider →
            </div>

          </button>

        </div>


        {/* Login */}

        <div className="text-center mt-8">

          <p className="text-slate-500">
            Already have an account?
          </p>

          <button
            onClick={() => navigate("/login")}
            className="mt-2 text-emerald-400 hover:text-emerald-300 font-bold"
          >
            Sign in →
          </button>

        </div>


        {/* Back */}

        <div className="text-center mt-6">

          <button
            onClick={() => navigate("/")}
            className="text-slate-500 hover:text-white text-sm transition"
          >
            ← Back to Landing Page
          </button>

        </div>

      </div>

    </div>
  );
}