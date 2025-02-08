const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const apiRoutes = require("./routes");

const session = require("express-session");

const routes = require("./routes"); // Import routes
require("dotenv").config();

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(helmet());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use("/api", apiRoutes);

app.use("*", (req, res) => {
  console.log("No route matched for:", req.method, req.originalUrl);
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
