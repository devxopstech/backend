const mongoose = require("mongoose");

const ChatRoom = require("../models/ChatRoom");
const sendNotification = require("../utils/sendNotification");

class ChatController {
  // Get all rooms created by the user and rooms the user has joined
  async getUserRooms(req, res) {
    try {
      const userId = req.user._id;

      // Rooms created by the user
      const createdRooms = await ChatRoom.find({ createdBy: userId });

      // Rooms where the user is a member but not the creator
      const joinedRooms = await ChatRoom.find({
        members: userId,
        createdBy: { $ne: userId }, // Exclude rooms where the user is the creator
      });

      console.log("Created Rooms:", createdRooms);
      console.log("Joined Rooms:", joinedRooms);

      res.status(200).json({ createdRooms, joinedRooms });
    } catch (err) {
      console.error("Server Error:", err);
      res.status(500).json({ error: "Server Error" });
    }
  }
  // Create a new room
  async createRoom(req, res) {
    const { name } = req.body;

    try {
      const newRoom = new ChatRoom({
        name,
        createdBy: req.user.id,
        members: [req.user.id], // Add creator as the first member
      });

      await newRoom.save();
      res.status(201).json(newRoom);
    } catch (err) {
      res.status(500).json({ error: "Error creating room" });
    }
  }

  // Get a specific room by ID
  async getRoomById(req, res) {
    try {
      const room = await ChatRoom.findById(req.params.id);
      if (!room) return res.status(404).json({ error: "Room not found" });

      res.status(200).json(room);
    } catch (err) {
      res.status(500).json({ error: "Server Error" });
    }
  }

  // Invite a user to a room
  async inviteUserToRoom(req, res) {
    const { roomId } = req.params;
    const { userId } = req.body;

    try {
      const room = await ChatRoom.findById(roomId);
      if (!room)
        return res.status(404).json({ message: "Chat room not found" });

      // Send notification to the invited user with roomId in metadata
      await sendNotification(userId, req.user.id, {
        type: "chat_invite",
        message: `You've been invited to join the chat room: ${room.name}`,
        metadata: { roomId: room._id }, // Add this line to include roomId
      });

      res.status(200).json({ message: "User invited successfully" });
    } catch (error) {
      console.error("Error inviting user:", error);
      res.status(500).json({ message: "Server error inviting user" });
    }
  }

  // Accept invitation to join a room
  async acceptRoomInvite(req, res) {
    const { roomId } = req.body;

    try {
      const room = await ChatRoom.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }

      const userId = new mongoose.Types.ObjectId(req.user.id); // Ensure user ID is an ObjectId
      console.log("User ID from request:", userId);
      console.log("Fetched Room:", room);

      // Check if the user is already in the room
      const isMember = room.members.some(
        (member) => member.toString() === userId.toString()
      );

      if (!isMember) {
        room.members.push(userId);
        await room.save();
        console.log("User added to room members:", room.members);
      }

      res.status(200).json({ message: "Joined room successfully" });
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Server error joining room" });
    }
  }
  async deleteRoom(req, res) {
    try {
      const { roomId } = req.params;
      await ChatRoom.findByIdAndDelete(roomId);
      res.status(200).json({ message: "Room deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete room" });
    }
  }
  async leaveRoom(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.id; // Assuming you have middleware to authenticate users
      const room = await ChatRoom.findById(roomId);

      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      room.members = room.members.filter(
        (member) => member.toString() !== userId
      );
      await room.save();

      res.status(200).json({ message: "Left the room successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to leave room" });
    }
  }
}

module.exports = new ChatController();
