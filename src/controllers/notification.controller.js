const Notification = require("../models/Notification");
const Employee = require("../models/employeeSchema");
const Schedule = require("../models/scheduleSchema");
class NotificationController {
  async getNotifications(req, res) {
    try {
      const notifications = await Notification.find({
        userId: req.user._id,
      }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async handleAccept(req, res) {
    try {
      const { notificationId } = req.params;
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      // Update employee status to accepted
      await Employee.findOneAndUpdate(
        {
          userId: req.user._id,
          scheduleId: notification.scheduleId,
        },
        { status: "accepted" }
      );

      // Mark notification as read
      notification.read = true;
      notification.status = "accepted";
      await notification.save();

      res.json({
        success: true,
        message: "Invitation accepted successfully",
      });
    } catch (error) {
      console.error("Accept invitation error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async handleReject(req, res) {
    try {
      const { notificationId } = req.params;
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      const schedule = await Schedule.findById(notification.scheduleId);
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Schedule not found",
        });
      }

      // Update the current notification instead of creating a new one
      notification.status = "rejected";
      notification.read = true;
      notification.senderId = notification.senderId || schedule.userId; // Use original sender if available
      await notification.save();

      // Update employee status
      await Employee.findOneAndUpdate(
        {
          userId: req.user._id,
          scheduleId: notification.scheduleId,
        },
        { status: "rejected" }
      );

      // Create notification for schedule creator
      const rejectionNotification = new Notification({
        userId: schedule.userId,
        senderId: req.user._id,
        type: "invitation_rejected",
        message: `${req.user.email} has rejected your schedule invitation`,
        scheduleId: notification.scheduleId,
        status: "rejected",
        read: false,
      });

      await rejectionNotification.save();

      res.json({
        success: true,
        message: "Invitation rejected successfully",
      });
    } catch (error) {
      console.error("Reject invitation error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async markAsOpened(req, res) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { read: true },
        { new: true }
      );

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error("Mark notification error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new NotificationController();
