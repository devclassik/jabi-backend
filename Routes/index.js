const express = require("express");
const router = express();

const mailRoute = require("./mail/mail");
const userRoute = require("./user/user");
const authRoute = require("./auth/auth");


router.use("/mail", mailRoute);
router.use("/user", userRoute);
router.use("/auth", authRoute);

module.exports = router;
