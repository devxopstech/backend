const express = require("express");
const { USER_CONTROLLER } = require("../controllers");
const auth = require("../middlewares/auth.middleware");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const router = express.Router();

router.post(
  "/updateProfilePicture",
  auth,
  upload.single("profilePicture"),
  USER_CONTROLLER.updateProfilePicture
);
router.get("/:userId/builds", auth, USER_CONTROLLER.getUserBuilds);
router.post(
  "/:userId/builds/increment",
  auth,
  USER_CONTROLLER.incrementUserBuilds
);
module.exports = router;
