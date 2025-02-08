const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { uploadToS3 } = require("../services/s3Service");
const jwtSecret = "HaHa";
class UserController {
  async updateProfilePicture(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      const imageUrl = await uploadToS3(req.file, user._id);

      await User.findByIdAndUpdate(user._id, {
        profilePicture: imageUrl,
      });

      res.json({
        success: true,
        data: { imageUrl },
      });
    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload profile picture",
      });
    }
  }
  async getUserBuilds(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.json({
        success: true,
        data: user.usageStats.monthlyBuilds.count,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async incrementUserBuilds(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          $inc: { "usageStats.monthlyBuilds.count": 1 },
          $set: { "usageStats.monthlyBuilds.lastResetDate": new Date() },
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.json({
        success: true,
        data: user.usageStats.monthlyBuilds.count,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new UserController();
