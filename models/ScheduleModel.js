const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
    Date: { type: String, required: true },
    Day: { type: String, required: true },
    Hour: { type: String, required: true },
    FullName: { type: String, default: "" },
    Tel: { type: String, default: "" },
    Comments: { type: String, default: "" },
  });

module.exports.ScheduleSchema = mongoose.model("Schedules", ScheduleSchema);
