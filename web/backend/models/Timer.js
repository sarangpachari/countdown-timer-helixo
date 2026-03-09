import mongoose from "mongoose";

const timerSchema = new mongoose.Schema(
  {
    shopDomain: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      default: "#4A90E2",
    },
    size: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
    position: {
      type: String,
      enum: ["top", "bottom", "inline"],
      default: "bottom",
    },
    urgencyType: {
      type: String,
      enum: ["color_pulse", "notification_banner", "none"],
      default: "color_pulse",
    },
    urgencyThresholdMinutes: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: computed status based on current time
timerSchema.virtual("status").get(function () {
  const now = new Date();
  if (now < this.startDate) return "scheduled";
  if (now > this.endDate) return "expired";
  return "active";
});

// Virtual: is the timer currently active?
timerSchema.virtual("isActive").get(function () {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
});

const Timer = mongoose.model("Timer", timerSchema);

export default Timer;
