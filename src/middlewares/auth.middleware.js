const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization;
    console.log("Received authorization header:", bearerToken);

    if (!bearerToken || !bearerToken.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = bearerToken.split(" ")[1];
    console.log("Token to verify:", token);

    const jwtSecret = process.env.JWT_SECRET || "HaHa";

    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log("Decoded token:", decoded);

      const user = await User.findOne({ email: decoded.email });
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      console.log("JWT verification error:", jwtError);
      return res.status(401).json({ error: "Invalid token." });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: "Invalid token." });
  }
};

module.exports = auth;
