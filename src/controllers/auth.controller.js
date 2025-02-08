const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../sendEmail");
require("dotenv").config();

const saltNumber = 10;
const jwtSecret = "HaHa"; // In production, use environment variable

class AuthController {
  // Create User
  async createUser(req, res) {
    console.log("Request received at /createUser");

    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.json({ success: false, message: "Enter valid credentials" });

    const { email, password, name } = req.body;
    console.log(email, password);

    try {
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.json({
          success: false,
          message: "Email already exists",
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(saltNumber);
      const securedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = new User({
        name,
        email,
        password: securedPassword,
        verified: false,
        subscriptionTier: "free", // Default tier
        usageStats: {
          monthlyBuilds: { count: 0, lastResetDate: new Date() },
          monthlySchedules: { count: 0, lastResetDate: new Date() },
          employeesCount: 0,
        },
      });

      await newUser.save();

      const authToken = jwt.sign({ email }, process.env.AUTH_SECRET);

      // Send email verification link
      const url = `${process.env.BASE_URL}users/verify/${authToken}`;
      await sendEmail(email, "Verify Email", url);

      return res.status(201).json({
        success: true,
        message: "An email sent to verify your account",
        data: {
          id: newUser._id,
          authToken,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong, try again later",
        error: error.message,
      });
    }
  }

  // Login User
  async loginUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.json({ success: false, message: "Enter valid credentials" });

    const { email, password } = req.body;
    console.log(email, password);
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ success: false, message: "Email does not exist" });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.json({ success: false, message: "Enter a valid password" });
      }

      const authToken = jwt.sign({ email }, process.env.AUTH_SECRET);

      // Check email verification
      if (!user.verified) {
        const url = `${process.env.BASE_URL}users/verify/${authToken}`;
        await sendEmail(email, "Verify Email", url);
        return res.json({
          success: false,
          message: "An email has been sent to verify your account",
          authToken,
        });
      }

      return res.json({
        success: true,
        message: "Login successful",
        data: {
          authToken,
          subscriptionTier: user.subscriptionTier,
          usageStats: user.usageStats,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong, try again later",
        error: error.message,
      });
    }
  }

  // Verify Email
  async verifyEmail(req, res) {
    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ success: false, message: "Invalid link" });
      }

      await User.findOneAndUpdate({ email }, { verified: true });
      return res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong, try again later",
        error: error.message,
      });
    }
  }

  // Forgot Password
  async forgotPassword(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.json({ success: false, message: "Enter valid credentials" });

    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ success: false, message: "Email does not exist" });
      }

      const authToken = jwt.sign({ email }, jwtSecret);
      const url = `${process.env.BASE_URL}users/reset/${authToken}`;
      await sendEmail(email, "Reset Password", url);

      return res.json({
        success: true,
        message: "An email has been sent to reset your password",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong, try again later",
        error: error.message,
      });
    }
  }

  // Update Password
  async updatePassword(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.json({ success: false, message: "Enter valid credentials" });

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ success: false, message: "Email does not exist" });
      }

      const salt = await bcrypt.genSalt(saltNumber);
      const securedPassword = await bcrypt.hash(password, salt);

      await User.findOneAndUpdate({ email }, { password: securedPassword });
      return res.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong, try again later",
        error: error.message,
      });
    }
  }

  // Check Token
  async checkToken(req, res) {
    try {
      const { authToken } = req.body;
      const decoded = jwt.verify(authToken, jwtSecret);

      const user = await User.findOne({ email: decoded.email });
      return res.json({ success: !!user });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong, try again later",
        error: error.message,
      });
    }
  }

  async getUserDetails(req, res) {
    try {
      const bearerToken = req.headers.authorization;
      if (!bearerToken || !bearerToken.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "No token provided",
        });
      }

      const token = bearerToken.split(" ")[1];
      const jwtSecret = process.env.JWT_SECRET || "HaHa";
      const decoded = jwt.verify(token, jwtSecret);

      const user = await User.findOne({ email: decoded.email }).select(
        "-password"
      );
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Check and reset monthly stats if needed
      const now = new Date();
      if (user.usageStats?.monthlyBuilds?.lastResetDate) {
        const lastReset = new Date(user.usageStats.monthlyBuilds.lastResetDate);
        if (
          lastReset.getMonth() !== now.getMonth() ||
          lastReset.getFullYear() !== now.getFullYear()
        ) {
          user.usageStats.monthlyBuilds.count = 0;
          user.usageStats.monthlyBuilds.lastResetDate = now;
          user.usageStats.monthlySchedules.count = 0;
          user.usageStats.monthlySchedules.lastResetDate = now;
          await user.save();
        }
      }

      return res.json({
        success: true,
        data: {
          ...user._doc,
          subscriptionTier: user.subscriptionTier || "free",
          usageStats: user.usageStats || {
            monthlyBuilds: { count: 0, lastResetDate: now },
            monthlySchedules: { count: 0, lastResetDate: now },
          },
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to get user details",
        error: error.message,
      });
    }
  }
  async updateSubscription(req, res) {
    try {
      const { email, subscriptionTier } = req.body;

      const user = await User.findOneAndUpdate(
        { email },
        { subscriptionTier },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.json({
          success: false,
          message: "User not found",
        });
      }

      return res.json({
        success: true,
        message: "Subscription updated successfully",
        data: {
          subscriptionTier: user.subscriptionTier,
          usageStats: user.usageStats,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong, try again later",
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
