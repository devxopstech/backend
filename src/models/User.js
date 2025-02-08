const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false, // Make password optional for OAuth users
    },
    verified: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      default: false,
    },
    subscriptionTier: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    usageStats: {
      monthlyBuilds: {
        count: { type: Number, default: 0 },
        lastResetDate: { type: Date, default: Date.now },
      },
      monthlySchedules: {
        count: { type: Number, default: 0 },
        lastResetDate: { type: Date, default: Date.now },
      },
      employeesCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
