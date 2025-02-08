const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stations: { type: Number, required: false },
  shifts: {
    morning: { checked: Boolean, startTime: String, endTime: String },
    afternoon: { checked: Boolean, startTime: String, endTime: String },
    night: { checked: Boolean, startTime: String, endTime: String },
  },
  deadline: {
    enabled: Boolean,
    day: String,
    time: String,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Schedule", scheduleSchema);
