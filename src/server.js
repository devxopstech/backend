const mongoose = require("mongoose");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const app = require("./app");
const session = require("express-session");

const chatController = require("./controllers/chat.controller"); // Import the ChatController
const cors = require("cors");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
// Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Socket.IO server with CORS
const io = new Server(server, {
  cors: {
    origin: "https://main.d1rauwgramm24y.amplifyapp.com/",
    methods: ["GET", "POST"],
  },
});
app.use(
  cors({
    origin: "*", // Allow your frontend origin
    credentials: true,
  })
);
// Socket.IO connection logic
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("sendMessage", ({ roomId, message, sender }) => {
    // Emit the message to all users in the room, including the sender's name
    io.to(roomId).emit("receiveMessage", { message, sender });
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://kampremiumyt:CfBF6Rsm3FLwwQxy@cluster0.moaux.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {});
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});
