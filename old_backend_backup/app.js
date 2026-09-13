const express = require("express");
const cors = require("cors");

const passengerRoutes = require("./routes/passengerRoutes");
const riderRoutes = require("./routes/riderRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());


// AUTH
app.use(
    "/api/auth",
    authRoutes
);


// PASSENGER
app.use(
    "/api/rides",
    passengerRoutes
);


// RIDER
app.use(
    "/api/rider",
    riderRoutes
);


app.get(
    "/",
    (req, res) => {
        res.json({
            message:
                "Smart Ride API is running"
        });
    }
);

module.exports = app;