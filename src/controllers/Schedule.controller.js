const Schedule = require("../models/scheduleSchema");
const mongoose = require("mongoose");
const Employee = require("../models/employeeSchema");
const Priority = require("../models/prioritySchema");
const WorkArrangement = require("../models/workArrangementSchema");
const { getUserBuilds, incrementUserBuilds } = require("../utils/userStats");
class ScheduleController {
  async createSchedule(req, res) {
    try {
      const user = req.user; // Get the entire user object
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const newSchedule = new Schedule({
        ...req.body,
        userId: user._id, // Use user._id instead of userId
      });

      await newSchedule.save();
      res.json({
        success: true,
        data: newSchedule,
      });
    } catch (error) {
      console.error("Create schedule error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create schedule",
      });
    }
  }

  async getSchedules(req, res) {
    try {
      const user = req.user;

      // Get schedules created by user
      const ownedSchedules = await Schedule.find({ userId: user._id });

      // Get schedules where user is an accepted employee
      const employeeSchedules = await Employee.find({
        userId: user._id,
        status: "accepted",
      }).populate("scheduleId");

      // Combine and format the schedules
      const allSchedules = [
        ...ownedSchedules.map((schedule) => ({
          ...schedule.toObject(),
          isOwner: true,
        })),
        ...employeeSchedules
          .filter((emp) => emp.scheduleId) // Filter out any null scheduleIds
          .map((emp) => ({
            ...emp.scheduleId.toObject(),
            isEmployee: true,
          })),
      ];

      res.json({
        success: true,
        data: allSchedules,
      });
    } catch (error) {
      console.error("Get schedules error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch schedules",
      });
    }
  }

  async getSchedule(req, res) {
    try {
      const user = req.user;
      const scheduleId = req.params.id;

      // First try to find schedule where user is owner
      let schedule = await Schedule.findOne({
        _id: scheduleId,
        userId: user._id,
      });

      // If not found as owner, check if user is an accepted employee
      if (!schedule) {
        const employeeRecord = await Employee.findOne({
          userId: user._id,
          scheduleId: scheduleId,
          status: "accepted",
        });

        if (employeeRecord) {
          schedule = await Schedule.findById(scheduleId);
        }
      }

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Schedule not found",
        });
      }

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      console.error("Get schedule error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch schedule",
      });
    }
  }
  // async getSchedule(req, res) {
  //   try {
  //     const user = req.user;
  //     const schedule = await Schedule.findOne({
  //       _id: req.params.id,
  //       userId: user._id,
  //     });
  //     if (!schedule) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "Schedule not found",
  //       });
  //     }
  //     res.json({
  //       success: true,
  //       data: schedule,
  //     });
  //   } catch (error) {
  //     console.error("Get schedule error:", error);
  //     res.status(500).json({
  //       success: false,
  //       message: error.message || "Failed to fetch schedule",
  //     });
  //   }
  // }

  async updateSchedule(req, res) {
    try {
      const user = req.user;
      const updatedSchedule = await Schedule.findOneAndUpdate(
        { _id: req.params.id, userId: user._id },
        req.body,
        { new: true }
      );
      if (!updatedSchedule) {
        return res.status(404).json({
          success: false,
          message: "Schedule not found",
        });
      }
      res.json({
        success: true,
        data: updatedSchedule,
      });
    } catch (error) {
      console.error("Update schedule error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update schedule",
      });
    }
  }

  async deleteSchedule(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;

      console.log("Received ID:", id, typeof id);
      console.log("User ID:", user._id, typeof user._id);

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Schedule ID" });
      }

      const deletedSchedule = await Schedule.findOneAndDelete({
        _id: id,
        userId: user._id,
      });

      if (!deletedSchedule) {
        return res
          .status(404)
          .json({ success: false, message: "Schedule not found" });
      }

      res.json({ success: true, message: "Schedule deleted successfully" });
    } catch (error) {
      console.error("Delete schedule error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete schedule",
      });
    }
  }
  async generateWorkArrangement(req, res) {
    try {
      const { scheduleId } = req.params;
      const userId = req.user._id;

      // Check build limit for free users
      const currentBuilds = await getUserBuilds(userId);
      if (req.user.subscriptionTier === "free" && currentBuilds >= 5) {
        return res.status(403).json({
          success: false,
          message: "Free trial limit reached",
        });
      }

      // 1. Fetch all priorities for this schedule
      const priorities = await Priority.find({ scheduleId }).populate(
        "userId",
        "name email"
      );

      if (!priorities.length) {
        return res.status(400).json({
          success: false,
          message: "No priorities found for this schedule",
        });
      }

      // 2. Create arrangement data structure
      const arrangements = {};

      // Process each priority and create optimal arrangements
      priorities.forEach((priority) => {
        priority.preferences.forEach((pref) => {
          const [day, shift] = pref.split("-");

          if (!arrangements[pref]) {
            arrangements[pref] = [];
          }

          arrangements[pref].push({
            userId: priority.userId._id,
            name: priority.userId.name || priority.userId.email,
            station: priority.station,
          });
        });
      });

      // 3. Save the generated arrangement
      const workArrangement = new WorkArrangement({
        scheduleId,
        arrangements,
        generatedBy: req.user._id,
        generatedAt: new Date(),
      });

      await workArrangement.save();

      // Increment build count for free users after successful generation
      if (req.user.subscriptionTier === "free") {
        await incrementUserBuilds(userId);
      }

      res.json({
        success: true,
        data: workArrangement,
      });
    } catch (error) {
      console.error("Generate work arrangement error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate work arrangement",
      });
    }
  }

  async getWorkArrangement(req, res) {
    try {
      const { scheduleId } = req.params;
      const userId = req.user._id;

      console.log("Getting arrangement for schedule:", scheduleId);

      const arrangement = await WorkArrangement.findOne({ scheduleId }).sort({
        generatedAt: -1,
      });

      // Include build count in response
      const buildCount = await getUserBuilds(userId);

      if (!arrangement) {
        return res.json({
          success: true,
          data: null,
          buildCount,
          subscriptionTier: req.user.subscriptionTier,
        });
      }

      res.json({
        success: true,
        data: arrangement,
        buildCount,
        subscriptionTier: req.user.subscriptionTier,
      });
    } catch (error) {
      console.error("Get work arrangement error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new ScheduleController();
