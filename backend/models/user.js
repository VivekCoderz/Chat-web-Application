const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
 {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["user", "seller"],
      default: "user",
    },

    bio: {
      type: String,
      default: "",
    },

    whatsappAbout: {
      type: String,
      default: "Hey there! I am using NexaChat.",
    },

    shopName: {
      type: String,
      default: "",
    },

    shopImage: {
      type: String,
      default: "",
    },

    instagramLink: {
      type: String,
      default: "",
    },

    whatsappLink: {
      type: String,
      default: "",
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
{
    timestamps:true
});

userSchema.pre("save",async function(){

    if(!this.isModified("password"))
        return

    this.password = await bcrypt.hash(this.password,10);


});

userSchema.methods.comparePassword = async function(password){

    return await bcrypt.compare(password,this.password);

}

module.exports = mongoose.model("User",userSchema);