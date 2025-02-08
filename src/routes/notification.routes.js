const express = require("express");
const { NOTIFICATION_CONTROLLER } = require("../controllers");
const auth = require("../middlewares/auth.middleware");
const router = express.Router();

router.get("/", auth, NOTIFICATION_CONTROLLER.getNotifications);
router.post(
  "/:notificationId/accept",
  auth,
  NOTIFICATION_CONTROLLER.handleAccept
);
router.post(
  "/:notificationId/reject",
  auth,
  NOTIFICATION_CONTROLLER.handleReject
);
router.put("/:id/opened", auth, NOTIFICATION_CONTROLLER.markAsOpened);

module.exports = router;
