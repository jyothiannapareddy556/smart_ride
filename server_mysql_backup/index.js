const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const paymentRoutes = require("./routes/paymentRoutes");
const authRoutes = require("./routes/authRoutes");
const passengerRoutes = require("./routes/passengerRoutes");
const riderRoutes = require("./routes/riderRoutes");

const app = express();

const PORT = 5000;


/*
========================================================
MIDDLEWARE
========================================================
*/

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({
  extended: true,
}));


/*
========================================================
TEST ROUTE
========================================================
*/

app.get("/", (req, res) => {
  res.json({
    message: "RideBack server is running",
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "RideBack API is working",
  });
});


/*
========================================================
API ROUTES
========================================================
*/

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/rides",
  passengerRoutes
);

app.use(
  "/api/rider",
  riderRoutes
);

app.use("/api/payment", paymentRoutes);


/*
========================================================
ERROR HANDLER
========================================================
*/

app.use(
  (err, req, res, next) => {

    console.error(err);

    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
);


/*
========================================================
START SERVER
========================================================
*/

app.listen(PORT, () => {

  console.log("");
  console.log("====================================");
  console.log("🚗 RideBack Server");
  console.log("====================================");
  console.log(
    `✅ Server running on http://localhost:${PORT}`
  );
  console.log(
    `✅ API running on http://localhost:${PORT}/api`
  );
  console.log("====================================");
  console.log("");

});