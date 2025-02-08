// backend/utils/userStats.js
const User = require("../models/User");

const getUserBuilds = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user.usageStats.monthlyBuilds.count;
  } catch (error) {
    console.error("Error getting user builds:", error);
    return 0;
  }
};

const incrementUserBuilds = async (userId) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { "usageStats.monthlyBuilds.count": 1 },
        $set: { "usageStats.monthlyBuilds.lastResetDate": new Date() },
      },
      { new: true }
    );
    return user.usageStats.monthlyBuilds.count;
  } catch (error) {
    console.error("Error incrementing builds:", error);
    throw error;
  }
};

module.exports = {
  getUserBuilds,
  incrementUserBuilds,
};
