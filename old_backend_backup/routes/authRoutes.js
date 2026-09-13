const express = require("express");

const router = express.Router();

const {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

/*
========================================================
REGISTER
========================================================
*/

router.post("/register", register);

/*
========================================================
NORMAL LOGIN
========================================================
*/

router.post("/login", login);

/*
========================================================
GOOGLE LOGIN
========================================================
*/

router.post("/google", googleLogin);

/*
========================================================
FORGOT PASSWORD
========================================================
*/

router.post("/forgot-password", forgotPassword);

/*
========================================================
RESET PASSWORD
========================================================
*/

router.post("/reset-password", resetPassword);

module.exports = router;