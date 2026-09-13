import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChooseRole from "./pages/ChooseRole";
import PassengerDashboard from "./pages/PassengerDashboard";
import RiderDashboard from "./pages/RiderDashboard";
import BookRide from "./pages/BookRide";
import Profile from "./pages/Profile";
import RideHistory from "./pages/RideHistory";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Landing page */}
        <Route path="/" element={<Landing />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/choose-role" element={<ChooseRole />} />

        {/* Passenger */}
        <Route
          path="/passenger-dashboard"
          element={<PassengerDashboard />}
        />

        <Route
          path="/book-ride"
          element={<BookRide />}
        />

        <Route
          path="/ride-history"
          element={<RideHistory />}
        />

        {/* Rider */}
        <Route
          path="/rider-dashboard"
          element={<RiderDashboard />}
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={<Profile />}
        />

        {/* Anything unknown */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;