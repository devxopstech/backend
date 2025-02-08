const express = require("express");
const { EMPLOYEE_CONTROLLER } = require("../controllers");
const auth = require("../middlewares/auth.middleware");
const router = express.Router();

router.use((req, res, next) => {
  console.log("Employee route accessed:", req.method, req.url);
  next();
});

router.get("/schedule/:scheduleId", auth, EMPLOYEE_CONTROLLER.getEmployees);
router.post("/schedule/:scheduleId/add", auth, EMPLOYEE_CONTROLLER.addEmployee);
router.put("/:id", auth, EMPLOYEE_CONTROLLER.updateEmployee);
router.delete("/:id", auth, EMPLOYEE_CONTROLLER.deleteEmployee);

module.exports = router;
