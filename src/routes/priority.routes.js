const express = require("express");
const { PRIORITY_CONTROLLER } = require("../controllers");
const auth = require("../middlewares/auth.middleware");
const router = express.Router();

router.post("/create", auth, PRIORITY_CONTROLLER.createPriority);
router.get("/:scheduleId", auth, PRIORITY_CONTROLLER.getPriorities);
router.put("/:id", auth, PRIORITY_CONTROLLER.updatePriority);
router.delete("/:id", auth, PRIORITY_CONTROLLER.deletePriority);

module.exports = router;
