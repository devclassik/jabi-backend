const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Auth = require("../../Models/authModel");
const helper = require("../../Utilities/helpers");

require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc   Register new user
// @route  POST /api/auth/register
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, phoneNumber, role, password } = req.body;

    if (!username || !email || !phoneNumber || !password) {
      return helper.controllerResult({
        req,
        res,
        statusCode: 400,
        message: "Please provide all required fields",
      });
    }

    // Check if user exists
    const userExists = await Auth.findOne({ email });
    if (userExists) {
      return helper.controllerResult({
        req,
        res,
        statusCode: 400,
        message: "User already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await Auth.create({
      username,
      email,
      phoneNumber,
      role,
      password: hashedPassword,
    });

    if (!user) {
      return helper.controllerResult({
        req,
        res,
        statusCode: 400,
        message: "Invalid user data",
      });
    }

    return helper.controllerResult({
      req,
      res,
      statusCode: 201,
      result: {
        _id: user.id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        token: generateToken(user._id),
      },
      message: "User registered successfully",
    });
  } catch (error) {
    return helper.controllerResult({
      req,
      res,
      statusCode: 500,
      result: error,
      message: error.message,
    });
  }
});

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Auth.findOne({ email });

    if (!user) {
      return helper.controllerResult({
        req,
        res,
        statusCode: 401,
        message: "Invalid email or password (user not found)",
      });
    }

    if (!user.password) {
      return helper.controllerResult({
        req,
        res,
        statusCode: 401,
        message: "Invalid email or password (no password stored)",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return helper.controllerResult({
        req,
        res,
        statusCode: 401,
        message: "Invalid email or password (wrong password)",
      });
    }

    return helper.controllerResult({
      req,
      res,
      result: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
      message: "Login successful",
    });
  } catch (error) {
    return helper.controllerResult({
      req,
      res,
      statusCode: 500,
      result: error,
      message: error.message,
    });
  }
});

// @desc   Get current logged-in user
// @route  GET /api/auth/me
// @access Private
const currentUser = asyncHandler(async (req, res) => {
  try {
    return helper.controllerResult({
      req,
      res,
      result: req.user,
      message: "Current user fetched successfully",
    });
  } catch (error) {
    return helper.controllerResult({
      req,
      res,
      statusCode: 500,
      result: error,
      message: error.message,
    });
  }
});

// @desc   Update user profile
// @route  PUT /api/auth/update
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  try {
    const user = await Auth.findById(req.user.id);

    if (!user) {
      return helper.controllerResult({
        req,
        res,
        statusCode: 404,
        message: "User not found",
      });
    }

    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    return helper.controllerResult({
      req,
      res,
      result: {
        _id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id),
      },
      message: "User updated successfully",
    });
  } catch (error) {
    return helper.controllerResult({
      req,
      res,
      statusCode: 500,
      result: error,
      message: error.message,
    });
  }
});

// @desc   Forgot password (send reset link)
// @route  POST /api/auth/forgot-password
// @access Public
const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Auth.findOne({ email });

    if (!user) {
      return helper.controllerResult({
        req,
        res,
        statusCode: 404,
        message: "User not found",
      });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const mailBody = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); padding: 20px;">
      <h2 style="text-align: center; color: #007bff;">Password Reset Token</h2>

      <p>Hi,</p>

      <p>Copy this token and past it on the token part of the form , Note: this expire after 15 minutes :</p>
      ${resetToken}

      <p style="line-height: 1.6;">from all of us @Apostolic faith church Jabi !</p>

      <div style="border-top: 2px solid #007bff; padding-top: 20px; margin-top: 20px;">
        <p><strong>Contact:</strong> apostolicfaithjabi@gmail.com | 08130567664</p>
      </div>


      <p>In Christ,</p>

      <p style="font-weight: bold; color: #007bff;">The Apostolic Faith Church &copy; IT Team</p>
    </div>
  </div>
`;

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Reset password token",
      html: mailBody,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.log(error);
      return helper.controllerResult({
        req,
        res,
        statusCode: 500,
        result: error,
        message: error.message,
      });
    }

    return helper.controllerResult({
      req,
      res,
      // result: { resetToken },
      result: {},
      message: "Password reset link sent to email",
    });
  } catch (error) {
    return helper.controllerResult({
      req,
      res,
      statusCode: 500,
      result: error,
      message: error.message,
    });
  }
});

// @desc   Reset password
// @route  POST /api/auth/reset-password
// @access Public
const resetPassword = asyncHandler(async (req, res) => {
  try {
    const { token, password } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Auth.findById(decoded.id);

    if (!user) {
      return helper.controllerResult({
        req,
        res,
        statusCode: 404,
        message: "User not found",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    return helper.controllerResult({
      req,
      res,
      message: "Password reset successful",
    });
  } catch (error) {
    return helper.controllerResult({
      req,
      res,
      statusCode: 400,
      result: error,
      message: "Invalid or expired token",
    });
  }
});

module.exports = {
  registerUser,
  loginUser,
  currentUser,
  updateUser,
  forgotPassword,
  resetPassword,
};
