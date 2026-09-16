import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =========================
          NAVBAR
      ========================= */}

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}

          <Link
            to="/"
            className="flex items-center gap-3"
          >

            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-blue-200">
              S
            </div>

            <div>
              <h1 className="font-extrabold text-xl">
                Smart Ride
              </h1>

              <p className="text-[10px] text-slate-400 font-medium">
                Smart JOURNEY
              </p>
    </div>
          </Link>


          {/* Desktop navigation */}

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">

            <a
              href="#how"
              className="hover:text-blue-600 transition"
            >
              How It Works
            </a>

            <a
              href="#features"
              className="hover:text-blue-600 transition"
            >
              Features
            </a>

            <a
              href="#benefits"
              className="hover:text-blue-600 transition"
            >
              Benefits
            </a>

          </div>


          {/* Auth buttons */}

          <div className="flex items-center gap-3">

            <Link
              to="/login"
              className="hidden sm:block px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-blue-600 transition"
            >
              Login
            </Link>

            <Link
              to="/choose-role"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition"
            >
              Get Started
            </Link>

          </div>

        </div>

      </nav>


      {/* =========================
          HERO
      ========================= */}

      <section className="pt-32 pb-20 px-6 overflow-hidden">

        <div className="max-w-7xl mx-auto">

          <div className="grid lg:grid-cols-2 gap-14 items-center">


            {/* Hero text */}

            <div>

              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold mb-6">

                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />

                Smarter rides. Better journeys.

              </div>


              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">

                Turn every
                <span className="text-blue-600">
                  {" "}journey
                </span>

                <br />

                into a
                <span className="text-indigo-600">
                  {" "}smart ride.
                </span>

              </h1>


              <p className="text-lg md:text-xl text-slate-500 mt-7 max-w-xl leading-relaxed">

                Smart Ride connects passengers with riders who
                are already travelling their way — making travel
                more efficient, affordable and convenient.

              </p>


              {/* CTA */}

              <div className="flex flex-col sm:flex-row gap-4 mt-9">

                <Link
                  to="/choose-role"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-200 transition text-center"
                >
                  Start Riding →
                </Link>

                <a
                  href="#how"
                  className="border border-slate-200 bg-white hover:bg-slate-100 px-7 py-4 rounded-xl font-bold text-lg transition text-center"
                >
                  See How It Works
                </a>

              </div>


              {/* Trust */}

              <div className="flex items-center gap-4 mt-8">

                <div className="flex -space-x-2">

                  <div className="w-9 h-9 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center">
                    👨
                  </div>

                  <div className="w-9 h-9 rounded-full bg-green-200 border-2 border-white flex items-center justify-center">
                    👩
                  </div>

                  <div className="w-9 h-9 rounded-full bg-purple-200 border-2 border-white flex items-center justify-center">
                    🧑
                  </div>

                </div>

                <div>

                  <div className="text-yellow-500 text-sm">
                    ★★★★★
                  </div>

                  <p className="text-xs text-slate-500">
                    Built for smarter everyday travel
                  </p>

                </div>

              </div>

            </div>


            {/* Hero visual */}

            <div className="relative">

              {/* Background glow */}

              <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />


              <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 shadow-2xl shadow-blue-200">

                {/* Map-like background */}

                <div className="bg-white/10 rounded-3xl p-6 min-h-[470px] relative overflow-hidden">

                  {/* Road lines */}

                  <div className="absolute left-[18%] top-[-20%] w-24 h-[140%] bg-white/10 rotate-[25deg]" />

                  <div className="absolute right-[20%] top-[-20%] w-16 h-[140%] bg-white/10 rotate-[-30deg]" />

                  <div className="absolute left-[-20%] bottom-[25%] w-[140%] h-16 bg-white/10 rotate-[15deg]" />


                  {/* Pickup */}

                  <div className="absolute top-20 left-12">

                    <div className="bg-white rounded-2xl shadow-xl p-4">

                      <div className="flex items-center gap-3">

                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          📍
                        </div>

                        <div>

                          <p className="text-xs text-slate-400">
                            Pickup
                          </p>

                          <p className="font-bold text-slate-800">
                            Your Location
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>


                  {/* Rider */}

                  <div className="absolute top-[42%] left-[42%]">

                    <div className="relative">

                      <div className="w-16 h-16 rounded-full bg-blue-600 border-4 border-white shadow-xl flex items-center justify-center text-3xl">
                        🛵
                      </div>

                      <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Online
                      </div>

                    </div>

                  </div>


                  {/* Destination */}

                  <div className="absolute bottom-16 right-8">

                    <div className="bg-white rounded-2xl shadow-xl p-4">

                      <div className="flex items-center gap-3">

                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                          🏁
                        </div>

                        <div>

                          <p className="text-xs text-slate-400">
                            Destination
                          </p>

                          <p className="font-bold text-slate-800">
                            Your Destination
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>


                  {/* ETA card */}

                  <div className="absolute bottom-6 left-6 bg-white rounded-2xl shadow-xl px-5 py-4">

                    <p className="text-xs text-slate-400">
                      Estimated arrival
                    </p>

                    <p className="text-2xl font-extrabold text-slate-900">
                      8 min
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          STATS
      ========================= */}

      <section className="px-6 pb-20">

        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100">

          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">

            <div className="p-7 text-center">

              <p className="text-3xl font-extrabold text-blue-600">
                24/7
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Ride access
              </p>

            </div>


            <div className="p-7 text-center">

              <p className="text-3xl font-extrabold text-emerald-600">
                2
              </p>

              <p className="text-sm text-slate-500 mt-1">
                User experiences
              </p>

            </div>


            <div className="p-7 text-center">

              <p className="text-3xl font-extrabold text-indigo-600">
                100%
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Connected
              </p>

            </div>


            <div className="p-7 text-center">

              <p className="text-3xl font-extrabold text-orange-500">
                ♻️
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Less empty travel
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          HOW IT WORKS
      ========================= */}

      <section
        id="how"
        className="py-24 bg-white px-6"
      >

        <div className="max-w-7xl mx-auto">


          <div className="text-center max-w-2xl mx-auto mb-14">

            <p className="text-blue-600 font-bold uppercase tracking-wider text-sm">
              How it works
            </p>

            <h2 className="text-4xl md:text-5xl font-extrabold mt-3">
              Simple from start to finish
            </h2>

            <p className="text-slate-500 mt-5 text-lg">
              Smart Ride keeps the entire experience simple
              for both passengers and riders.
            </p>

          </div>


          <div className="grid md:grid-cols-3 gap-7">


            {/* Step 1 */}

            <div className="group p-8 rounded-3xl bg-slate-50 hover:bg-blue-50 transition border border-slate-100">

              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold shadow-lg shadow-blue-200">
                1
              </div>

              <h3 className="text-2xl font-extrabold mt-7">
                Find a ride
              </h3>

              <p className="text-slate-500 mt-3 leading-relaxed">
                Enter your pickup and destination and
                discover riders currently available.
              </p>

            </div>


            {/* Step 2 */}

            <div className="group p-8 rounded-3xl bg-slate-50 hover:bg-emerald-50 transition border border-slate-100">

              <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold shadow-lg shadow-emerald-200">
                2
              </div>

              <h3 className="text-2xl font-extrabold mt-7">
                Connect
              </h3>

              <p className="text-slate-500 mt-3 leading-relaxed">
                A rider can accept the request and connect
                with the passenger.
              </p>

            </div>


            {/* Step 3 */}

            <div className="group p-8 rounded-3xl bg-slate-50 hover:bg-indigo-50 transition border border-slate-100">

              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold shadow-lg shadow-indigo-200">
                3
              </div>

              <h3 className="text-2xl font-extrabold mt-7">
                Complete the ride
              </h3>

              <p className="text-slate-500 mt-3 leading-relaxed">
                Travel together and complete the ride once
                the passenger reaches the destination.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          FEATURES
      ========================= */}

      <section
        id="features"
        className="py-24 px-6 bg-slate-50"
      >

        <div className="max-w-7xl mx-auto">

          <div className="grid lg:grid-cols-2 gap-16 items-center">


            <div>

              <p className="text-blue-600 font-bold uppercase tracking-wider text-sm">
                Built around you
              </p>

              <h2 className="text-4xl md:text-5xl font-extrabold mt-3 leading-tight">
                Everything you need for a smarter ride.
              </h2>

              <p className="text-slate-500 text-lg mt-5 leading-relaxed">
                Smart Ride brings riders and passengers together
                through one simple, connected experience.
              </p>

            </div>


            <div className="grid sm:grid-cols-2 gap-5">


              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">

                <div className="text-3xl">
                  📍
                </div>

                <h3 className="font-extrabold text-lg mt-4">
                  Location aware
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Riders can share their current location
                  when they go online.
                </p>

              </div>


              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">

                <div className="text-3xl">
                  ⚡
                </div>

                <h3 className="font-extrabold text-lg mt-4">
                  Fast matching
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Quickly discover riders who are available
                  for a new request.
                </p>

              </div>


              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">

                <div className="text-3xl">
                  🔄
                </div>

                <h3 className="font-extrabold text-lg mt-4">
                  Live status
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Track the journey from pending to accepted
                  and completed.
                </p>

              </div>


              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">

                <div className="text-3xl">
                  🛡️
                </div>

                <h3 className="font-extrabold text-lg mt-4">
                  Simple & secure
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Separate rider and passenger experiences
                  keep the workflow clear.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          BENEFITS
      ========================= */}

      <section
        id="benefits"
        className="py-24 bg-white px-6"
      >

        <div className="max-w-7xl mx-auto">


          <div className="text-center mb-14">

            <p className="text-blue-600 font-bold uppercase tracking-wider text-sm">
              Why Smart Ride?
            </p>

            <h2 className="text-4xl md:text-5xl font-extrabold mt-3">
              Better for everyone
            </h2>

          </div>


          <div className="grid md:grid-cols-2 gap-8">


            {/* Passenger */}

            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-9 text-white">

              <div className="text-5xl">
                🚗
              </div>

              <h3 className="text-3xl font-extrabold mt-6">
                For Passengers
              </h3>

              <p className="text-blue-100 mt-3">
                Find convenient rides while travelling towards
                your destination.
              </p>


              <div className="space-y-4 mt-8">

                <div className="flex gap-3">
                  <span>✓</span>
                  <span>Find available riders</span>
                </div>

                <div className="flex gap-3">
                  <span>✓</span>
                  <span>View rider information</span>
                </div>

                <div className="flex gap-3">
                  <span>✓</span>
                  <span>Track ride status</span>
                </div>

              </div>


              <Link
                to="/choose-role"
                className="inline-block mt-8 bg-white text-blue-700 px-6 py-3 rounded-xl font-bold"
              >
                Find a Ride →
              </Link>

            </div>


            {/* Rider */}

            <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-9 text-white">

              <div className="text-5xl">
                🛵
              </div>

              <h3 className="text-3xl font-extrabold mt-6">
                For Riders
              </h3>

              <p className="text-emerald-100 mt-3">
                Make better use of your return journey after
                completing a delivery.
              </p>


              <div className="space-y-4 mt-8">

                <div className="flex gap-3">
                  <span>✓</span>
                  <span>Go online after delivery</span>
                </div>

                <div className="flex gap-3">
                  <span>✓</span>
                  <span>Receive passenger requests</span>
                </div>

                <div className="flex gap-3">
                  <span>✓</span>
                  <span>Complete additional rides</span>
                </div>

              </div>


              <Link
                to="/choose-role"
                className="inline-block mt-8 bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold"
              >
                Become a Rider →
              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          FINAL CTA
      ========================= */}

      <section className="px-6 py-24">

        <div className="max-w-6xl mx-auto rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-10 md:p-16 text-center shadow-2xl shadow-blue-200">

          <p className="text-blue-200 font-bold uppercase tracking-wider text-sm">
            Ready to ride smarter?
          </p>

          <h2 className="text-4xl md:text-5xl font-extrabold mt-4">
            Your next journey starts here.
          </h2>

          <p className="text-blue-100 max-w-2xl mx-auto mt-5 text-lg">
            Join Smart Ride and experience a simpler,
            smarter way to connect riders and passengers.
          </p>

          <Link
            to="/choose-role"
            className="inline-block mt-8 bg-white text-blue-700 px-8 py-4 rounded-xl font-extrabold text-lg hover:bg-blue-50 transition"
          >
            Get Started →
          </Link>

        </div>

      </section>


      {/* =========================
          FOOTER
      ========================= */}

      <footer className="bg-slate-950 text-white px-6 py-12">

        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col md:flex-row justify-between gap-8">

            <div>

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-extrabold">
                  S
                </div>

                <span className="text-xl font-extrabold">
                  Smart Ride
                </span>

              </div>

              <p className="text-slate-400 text-sm mt-4 max-w-sm">
                Smart journeys. Better returns. Connecting
                passengers and riders through smarter travel.
              </p>

            </div>


            <div className="flex gap-12">

              <div>

                <h4 className="font-bold mb-4">
                  Platform
                </h4>

                <div className="space-y-2 text-sm text-slate-400">

                  <a
                    href="#how"
                    className="block hover:text-white"
                  >
                    How it works
                  </a>

                  <a
                    href="#features"
                    className="block hover:text-white"
                  >
                    Features
                  </a>

                </div>

              </div>


              <div>

                <h4 className="font-bold mb-4">
                  Account
                </h4>

                <div className="space-y-2 text-sm text-slate-400">

                  <Link
                    to="/login"
                    className="block hover:text-white"
                  >
                    Login
                  </Link>

                  <Link
                    to="/choose-role"
                    className="block hover:text-white"
                  >
                    Register
                  </Link>

                </div>

              </div>

            </div>

          </div>


          <div className="border-t border-slate-800 mt-10 pt-6 text-sm text-slate-500 flex flex-col md:flex-row justify-between gap-3">

            <p>
              © {new Date().getFullYear()} Smart Ride. All rights reserved.
            </p>

            <p>
              Built for smarter transportation.
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}