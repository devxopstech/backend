const express = require("express");
const router = express.Router();
const ChatController = require("../controllers/chat.controller");
const User = require("../models/User"); // Import User model
const auth = require("../middlewares/auth.middleware");

// Chat room routes
router.get("/rooms", auth, (req, res) => ChatController.getUserRooms(req, res));
router.post("/rooms", auth, (req, res) => ChatController.createRoom(req, res));
router.get("/rooms/:id", auth, (req, res) =>
  ChatController.getRoomById(req, res)
);
router.post("/rooms/:roomId/invite", auth, (req, res) =>
  ChatController.inviteUserToRoom(req, res)
);
router.post("/rooms/accept-invite", auth, (req, res) =>
  ChatController.acceptRoomInvite(req, res)
);
router.delete("/rooms/:roomId", auth, (req, res) =>
  ChatController.deleteRoom(req, res)
);
router.post("/rooms/:roomId/leave", auth, (req, res) =>
  ChatController.leaveRoom(req, res)
);
// New route to fetch all users
router.get("/users", auth, async (req, res) => {
  try {
    const users = await User.find({}, "_id name"); // Only return user IDs and names
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error fetching users" });
  }
});

module.exports = router;
