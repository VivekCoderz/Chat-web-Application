const mongoose = require("mongoose");

const generalChatSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: String,
      },
    ],

    replyTo: {
      messageId: mongoose.Schema.Types.ObjectId,
      text: String,
      senderName: String,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("GeneralChat", generalChatSchema);