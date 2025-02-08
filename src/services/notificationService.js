const nodemailer = require("nodemailer");
const twilio = require("twilio");

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Twilio client
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send notification to user (e.g., in-app notification)
const sendNotification = async (userId, notification) => {
  // Save notification to the user's notifications array in the database
  await User.findByIdAndUpdate(userId, {
    $push: { notifications: notification },
  });
};

// Send invitation via email or SMS
const sendInvitation = async (recipient, invitationLink) => {
  if (recipient.includes("@")) {
    // Send email invitation
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: "Join Our App",
      html: `<p>You have been invited to join our app. Click <a href="${invitationLink}">here</a> to sign up.</p>`,
    });
  } else {
    // Send SMS invitation
    await twilioClient.messages.create({
      body: `You have been invited to join our app. Click here to sign up: ${invitationLink}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: recipient,
    });
  }
};

module.exports = { sendNotification, sendInvitation };
