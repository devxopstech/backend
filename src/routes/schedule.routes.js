const express = require("express");
const { SCHEDULE_CONTROLLER } = require("../controllers");
const auth = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/create", auth, SCHEDULE_CONTROLLER.createSchedule);
router.get("/", auth, SCHEDULE_CONTROLLER.getSchedules);
router.get("/:id", auth, SCHEDULE_CONTROLLER.getSchedule);
router.put("/:id", auth, SCHEDULE_CONTROLLER.updateSchedule);
router.delete("/:id", auth, SCHEDULE_CONTROLLER.deleteSchedule);

router.get("/:scheduleId/arrangement", auth, (req, res, next) => {
  console.log("Arrangement route hit", req.params);
  SCHEDULE_CONTROLLER.getWorkArrangement(req, res);
});
router.post(
  "/:scheduleId/generate-arrangement",
  auth,
  SCHEDULE_CONTROLLER.generateWorkArrangement
);

module.exports = router;
