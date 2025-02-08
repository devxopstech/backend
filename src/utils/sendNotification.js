const Notification = require("../models/Notification");

const sendNotification = async (
  userId,
  senderId,
  { type, message, scheduleId = null, metadata = {} }
) => {
  try {
    const notification = new Notification({
      userId,
      senderId,
      type,
      message,
      scheduleId,
      metadata, // Ensure metadata is included here
      createdAt: new Date(),
    });

    await notification.save();
    console.log("Notification sent:", notification); // Log the entire notification to verify
    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

module.exports = sendNotification;
