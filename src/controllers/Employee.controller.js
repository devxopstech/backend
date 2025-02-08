const Employee = require("../models/employeeSchema");
const User = require("../models/User");
const sendEmail = require("../sendEmail");
const sendNotification = require("../utils/sendNotification");
const Schedule = require("../models/scheduleSchema");
const Notification = require("../models/Notification");
class EmployeeController {
  async createEmployee(req, res) {
    try {
      const { userId } = req.user;
      const newEmployee = new Employee({ ...req.body, userId });
      await newEmployee.save();
      res.json({
        success: true,
        data: newEmployee,
      });
    } catch (error) {
      console.error("Create employee error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create employee",
      });
    }
  }

  async getEmployees(req, res) {
    try {
      const user = req.user;
      const { scheduleId } = req.params;

      console.log("Fetching employees for schedule:", scheduleId);

      const employees = await Employee.find({
        scheduleId,
      }).populate("userId", "name email profilePicture");

      console.log("Found employees:", employees);

      res.json({
        success: true,
        data: employees,
      });
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch employees",
      });
    }
  }

  async updateEmployee(req, res) {
    try {
      const { userId } = req.user;
      const updatedEmployee = await Employee.findOneAndUpdate(
        { _id: req.params.id, userId },
        req.body,
        { new: true }
      );
      if (!updatedEmployee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      res.json({
        success: true,
        data: updatedEmployee,
      });
    } catch (error) {
      console.error("Update employee error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update employee",
      });
    }
  }

  async deleteEmployee(req, res) {
    try {
      const { userId } = req.user;
      const deletedEmployee = await Employee.findOneAndDelete({
        _id: req.params.id,
        userId,
      });
      if (!deletedEmployee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      res.json({
        success: true,
        message: "Employee deleted successfully",
      });
    } catch (error) {
      console.error("Delete employee error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete employee",
      });
    }
  }

  async addEmployee(req, res) {
    try {
      const { email } = req.body;
      const { scheduleId } = req.params;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        // Handle invitation for non-registered user
        // ... your existing invitation code
        return res.json({
          success: true,
          message: "Invitation sent to unregistered user",
        });
      }

      // Check if user is already in this schedule
      const existingEmployee = await Employee.findOne({
        userId: user._id,
        scheduleId,
      });

      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: "User is already a member of this schedule",
        });
      }

      // Create new employee record
      const newEmployee = new Employee({
        name: user.name,
        email: user.email,
        userId: user._id,
        scheduleId,
        status: "pending",
      });

      await newEmployee.save();

      // Create notification
      const notification = new Notification({
        userId: user._id,
        senderId: req.user._id,
        type: "schedule_invite",
        message: `You have been invited to join a schedule`,
        scheduleId,
        status: "pending",
      });

      await notification.save();

      res.json({
        success: true,
        message: "Employee added and invitation sent successfully",
      });
    } catch (error) {
      console.error("Add employee error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to add employee",
      });
    }
  }

  // Add method to handle invitation responses
  async handleInvitation(req, res) {
    const { notificationId } = req.params;
    const { response } = req.body; // 'accept' or 'reject'

    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Invitation not found",
        });
      }

      const employee = await Employee.findOne({
        userId: req.user._id,
        scheduleId: notification.scheduleId,
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee record not found",
        });
      }

      employee.status = response === "accept" ? "accepted" : "rejected";
      await employee.save();

      notification.status = response === "accept" ? "accepted" : "rejected";
      await notification.save();

      return res.json({
        success: true,
        message: `Invitation ${response}ed successfully`,
      });
    } catch (error) {
      console.error("Handle invitation error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new EmployeeController();
