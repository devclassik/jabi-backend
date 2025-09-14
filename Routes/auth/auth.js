const express = require("express");
const validateTokenHandler = require("../../Utilities/validateToken");

const {
  registerUser,
  loginUser,
  currentUser,
  updateUser,
  forgotPassword,
  resetPassword,
} = require("../../Controllers/auth/auth");

const router = express.Router();


router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/current", validateTokenHandler, currentUser);
router.put("/update", validateTokenHandler, updateUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
