const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
} = require("firebase/firestore");
const { successResponse, failedResponse } = require("../utils/responseHandler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const saltNumber = 10;
const jwt = require("jsonwebtoken");
const sendEmail = require("../sendEmail");
require("dotenv").config();

// Firebase config
const firebaseConfig = require("../config/firebase.config");

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const jwtSecret = "HaHa";

class AuthController {
  // Create User
  async createUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.json({ success: false, message: "Enter valid credentials" });

    const salt = await bcrypt.genSalt(saltNumber);
    const securedPassword = await bcrypt.hash(req.body.password, salt);
    const email = req.body.email;
    console.log(email);

    try {
      // Check if the email already exists in Firestore
      const usersRef = collection(db, "users");
      const emailQuery = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(emailQuery);

      if (!snapshot.empty) {
        return res.json({
          success: false,
          message: "Email already exists",
        });
      }

      // Create a new user object
      const newUser = {
        name: req.body.name,
        email: email,
        password: securedPassword,
        verified: false,
      };
      console.log(newUser);

      // Add the new user to the Firestore collection
      const docRef = await addDoc(usersRef, newUser);

      const authToken = jwt.sign({ email }, jwtSecret);

      // Send email verification link
      const url = `${process.env.BASE_URL}users/verify/${authToken}`;
      await sendEmail(email, "Verify Email", url);

      successResponse(res, 201, "An email sent to verify your account", {
        id: docRef.id,
        authToken,
      });
    } catch (error) {
      failedResponse(res, 500, "Something went wrong, try again later", error);
    }
  }

  // Login User
  async loginUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.json({ success: false, message: "Enter valid credentials" });

    const email = req.body.email;

    try {
      // Get user by email
      const usersRef = collection(db, "users");
      const emailQuery = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(emailQuery);

      if (snapshot.empty) {
        return res.json({ success: false, message: "Email does not exist" });
      }

      const user = snapshot.docs[0].data();

      // Check password
      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!validPassword) {
        return res.json({ success: false, message: "Enter a valid password" });
      }

      const authToken = jwt.sign({ email }, jwtSecret);

      // Check email verification
      if (!user.verified) {
        const url = `${process.env.BASE_URL}users/verify/${authToken}`;
        await sendEmail(email, "Verify Email", url);
        return res.json({
          success: false,
          message: "An email has been sent to verify your account",
          authToken,
        });
      }

      successResponse(res, 200, "Login successful", { authToken });
    } catch (error) {
      failedResponse(res, 500, "Something went wrong, try again later", error);
    }
  }

  // Verify Email
  async verifyEmail(req, res) {
    const email = req.body.email;

    try {
      const usersRef = collection(db, "users");
      const emailQuery = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(emailQuery);

      if (snapshot.empty) {
        return res.json({ success: false, message: "Invalid link" });
      }

      const docId = snapshot.docs[0].id;
      await updateDoc(doc(db, "users", docId), { verified: true });

      successResponse(res, 200, "Email verified successfully");
    } catch (error) {
      failedResponse(res, 500, "Something went wrong, try again later", error);
    }
  }

  // Forgot Password
  async forgotPassword(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.json({ success: false, message: "Enter valid credentials" });

    const email = req.body.email;

    try {
      const usersRef = collection(db, "users");
      const emailQuery = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(emailQuery);

      if (snapshot.empty) {
        return res.json({ success: false, message: "Email does not exist" });
      }

      const authToken = jwt.sign({ email }, jwtSecret);
      const url = `${process.env.BASE_URL}users/reset/${authToken}`;
      await sendEmail(email, "Reset Password", url);

      successResponse(
        res,
        200,
        "An email has been sent to reset your password"
      );
    } catch (error) {
      failedResponse(res, 500, "Something went wrong, try again later", error);
    }
  }

  // Update Password
  async updatePassword(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.json({ success: false, message: "Enter valid credentials" });

    const salt = await bcrypt.genSalt(saltNumber);
    const securedPassword = await bcrypt.hash(req.body.password, salt);
    const email = req.body.email;

    try {
      const usersRef = collection(db, "users");
      const emailQuery = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(emailQuery);

      if (snapshot.empty) {
        return res.json({ success: false, message: "Email does not exist" });
      }

      const docId = snapshot.docs[0].id;
      await updateDoc(doc(db, "users", docId), { password: securedPassword });

      successResponse(res, 200, "Password updated successfully");
    } catch (error) {
      failedResponse(res, 500, "Something went wrong, try again later", error);
    }
  }

  // Check Token
  async checkToken(req, res) {
    try {
      const authToken = req.body.authToken;
      const decoded = jwt.verify(authToken, jwtSecret);

      const usersRef = collection(db, "users");
      const emailQuery = query(usersRef, where("email", "==", decoded.email));
      const snapshot = await getDocs(emailQuery);

      if (!snapshot.empty) {
        return res.json({ success: true });
      }

      res.json({ success: false });
    } catch (error) {
      failedResponse(res, 500, "Something went wrong, try again later", error);
    }
  }

  async getUserDetails(req, res) {
    try {
      const authToken = req.body.authToken;
      const decoded = jwt.verify(authToken, jwtSecret);
      const email = decoded.email;

      // Fetch user data from Firebase
      const usersRef = collection(db, "users");
      const emailQuery = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(emailQuery);

      if (snapshot.empty) {
        return res.json({
          success: false,
          message: "User not found",
        });
      }

      // Get the user document
      const userData = snapshot.docs[0].data();

      // Remove sensitive information
      delete userData.password;

      res.json({
        success: true,
        data: {
          ...userData,
          id: snapshot.docs[0].id,
        },
      });
    } catch (error) {
      failedResponse(res, 500, "Something went wrong, try again later", error);
    }
  }
}

module.exports = new AuthController();
