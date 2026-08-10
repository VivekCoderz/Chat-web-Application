const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // Expires in 24 hours (86400 seconds)
    },
  },
  {
    timestamps: true,
  }
);

storySchema.index({ user: 1 });

module.exports = mongoose.model("Story", storySchema);
