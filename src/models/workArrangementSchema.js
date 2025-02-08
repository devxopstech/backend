const mongoose = require("mongoose");

const workArrangementSchema = new mongoose.Schema({
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Schedule",
    required: true,
  },
  arrangements: {
    type: Map,
    of: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: String,
        station: String,
      },
    ],
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
});

const WorkArrangement = mongoose.model(
  "WorkArrangement",
  workArrangementSchema
);

module.exports = WorkArrangement;
