const express = require("express");
const { body, validationResult } = require("express-validator");
const { AUTH_CONTROLLER } = require("../controllers");
const auth = require("../middlewares/auth.middleware");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
router.post(
  "/createUser",
  [
    body("email").isEmail(),
    body("name").isLength({ min: 5 }),
    body("password").isLength({ min: 5 }),
  ],
  AUTH_CONTROLLER.createUser
);

router.post(
  "/loginUser",
  [body("email").isEmail(), body("password").isLength({ min: 5 })],
  AUTH_CONTROLLER.loginUser
);

router.post("/verification", AUTH_CONTROLLER.verifyEmail);
router.post(
  "/forgotPassword",
  [body("email").isEmail()],
  AUTH_CONTROLLER.forgotPassword
);

router.post(
  "/updatePassword",
  [body("email").isEmail(), body("password").isLength({ min: 5 })],
  AUTH_CONTROLLER.updatePassword
);

router.post("/checkToken", AUTH_CONTROLLER.checkToken);
router.post("/getUserDetails", AUTH_CONTROLLER.getUserDetails);
router.post("/updateSubscription", auth, AUTH_CONTROLLER.updateSubscription);

// Redirect to Cognito Hosted UI for Google Sign-In
router.get("/google", (req, res) => {
  const cognitoDomain = process.env.COGNITO_DOMAIN;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.COGNITO_REDIRECT_URI);

  const loginUrl = `${cognitoDomain}/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&identity_provider=Google&scope=openid+email+profile`;

  res.redirect(loginUrl);
});
router.get("/apple/callback", async (req, res) => {
  console.log("Apple Callback Request Query:", req.query); // Debug request

  const code = req.query.code;
  if (!code) {
    console.error("No authorization code provided");
    return res
      .status(400)
      .json({ success: false, message: "No authorization code provided" });
  }

  try {
    const tokenResponse = await fetch(
      `${process.env.COGNITO_DOMAIN}/oauth2/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: process.env.COGNITO_CLIENT_ID,
          client_secret: process.env.COGNITO_CLIENT_SECRET,
          code,
          redirect_uri: process.env.COGNITO_REDIRECT_URI,
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    console.log("Apple Token Response:", tokenData); // Debug response

    if (!tokenData.id_token) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to retrieve token" });
    }

    const decodedToken = JSON.parse(
      Buffer.from(tokenData.id_token.split(".")[1], "base64").toString()
    );
    console.log("Decoded Apple Token:", decodedToken);

    const email = decodedToken.email;
    const name = decodedToken.name || "Anonymous Apple User";

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        verified: true,
        subscriptionTier: "free",
      });
      await user.save();
    }

    const jwtToken = jwt.sign({ email }, process.env.AUTH_SECRET, {
      expiresIn: "7d",
    });

    console.log("Generated JWT Token:", jwtToken);
    res.redirect(`http://localhost:5173/auth-success?token=${jwtToken}`);
  } catch (error) {
    console.error("Apple Auth Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.get("/apple", (req, res) => {
  const cognitoDomain = process.env.COGNITO_DOMAIN;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.COGNITO_REDIRECT_URI);

  const loginUrl = `${cognitoDomain}/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&idp_identifier=Apple&scope=openid+email`;

  console.log("🔄 Redirecting directly to Apple OAuth:", loginUrl);
  res.redirect(loginUrl);
});

router.get("/apple/callback", async (req, res) => {
  const code = req.query.code;
  if (!req.query.code) {
    console.error("🚨 No authorization code received from Apple!");
    return res
      .status(400)
      .json({ success: false, message: "No authorization code provided" });
  }
  if (!code) {
    return res
      .status(400)
      .json({ success: false, message: "No authorization code provided" });
  }

  try {
    const tokenResponse = await fetch(
      `${process.env.COGNITO_DOMAIN}/oauth2/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: process.env.COGNITO_CLIENT_ID,
          client_secret: process.env.COGNITO_CLIENT_SECRET,
          code,
          redirect_uri: process.env.COGNITO_REDIRECT_URI,
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    console.log("Apple Token Response:", tokenData);

    if (!tokenData.id_token) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to retrieve token" });
    }

    const decodedToken = JSON.parse(
      Buffer.from(tokenData.id_token.split(".")[1], "base64").toString()
    );
    console.log("Decoded Apple Token:", decodedToken);

    const email = decodedToken.email;
    const name = decodedToken.name;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        verified: true,
        subscriptionTier: "free",
      });
      await user.save();
    }

    const jwtToken = jwt.sign({ email }, process.env.AUTH_SECRET, {
      expiresIn: "7d",
    });

    console.log("Generated JWT Token:", jwtToken);

    res.redirect(`http://localhost:5173/auth-success?token=${jwtToken}`);
  } catch (error) {
    console.error("Apple Auth Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;
