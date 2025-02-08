const Priority = require("../models/prioritySchema");
const WorkArrangement = require("../models/workArrangementSchema");

class PriorityController {
  async createPriority(req, res) {
    try {
      const user = req.user;
      const { scheduleId, station, preferences } = req.body;

      console.log("Creating priority:", {
        // Debug log
        userId: user._id,
        scheduleId,
        station,
        preferences,
      });

      const newPriority = new Priority({
        userId: user._id, // Add user ID from auth middleware
        scheduleId,
        station,
        preferences,
      });

      await newPriority.save();

      res.json({
        success: true,
        data: newPriority,
      });
    } catch (error) {
      console.error("Create priority error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create priority",
      });
    }
  }

  async getPriorities(req, res) {
    try {
      console.log("Getting priorities for schedule:", req.params.scheduleId);

      const priorities = await Priority.find({
        scheduleId: req.params.scheduleId,
      }).populate("userId", "name email"); // Populate user details

      console.log("Found priorities:", priorities);

      res.json({
        success: true,
        data: priorities,
      });
    } catch (error) {
      console.error("Get priorities error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  async updatePriority(req, res) {
    try {
      const { userId } = req.user;
      const updatedPriority = await Priority.findOneAndUpdate(
        { _id: req.params.id, userId },
        req.body,
        { new: true }
      );
      if (!updatedPriority) {
        return res.status(404).json({
          success: false,
          message: "Priority not found",
        });
      }
      res.json({
        success: true,
        data: updatedPriority,
      });
    } catch (error) {
      console.error("Update priority error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update priority",
      });
    }
  }

  async deletePriority(req, res) {
    try {
      const { userId } = req.user;
      const deletedPriority = await Priority.findOneAndDelete({
        _id: req.params.id,
        userId,
      });
      if (!deletedPriority) {
        return res.status(404).json({
          success: false,
          message: "Priority not found",
        });
      }
      res.json({
        success: true,
        message: "Priority deleted successfully",
      });
    } catch (error) {
      console.error("Delete priority error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete priority",
      });
    }
  }
}

module.exports = new PriorityController();
