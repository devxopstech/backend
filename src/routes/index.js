const express = require("express");
const authRoutes = require("./auth.routes");
const scheduleRoutes = require("./schedule.routes");
const priorityRoutes = require("./priority.routes");
const employeeRoutes = require("./employee.routes");
const userRoutes = require("./user.routes");
const notificationRoutes = require("./notification.routes");
const chatRoutes = require("./chat.routes");

const router = express.Router();

console.log("Setting up routes...");

router.get("/health", (req, res) => {
  console.log("Health check endpoint hit");
  res.json({ success: true, message: "API is healthy" });
});

router.use("/auth", authRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/priorities", priorityRoutes);
router.use("/employees", employeeRoutes);
router.use("/users", userRoutes);
router.use("/notifications", notificationRoutes);
router.use("/chat", chatRoutes);

console.log("Routes setup complete");

module.exports = router;
