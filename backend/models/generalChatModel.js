const mongoose = require("mongoose")
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
  },
  {
    timestamps: true,
  }
);

const GeneralChat = mongoose.model(
  "GeneralChat",
  generalChatSchema
);

module.exports =  GeneralChat