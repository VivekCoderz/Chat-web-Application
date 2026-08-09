const express = require("express");
require("dotenv").config();
const http = require("http");
const cors = require("cors");
const socketio = require("socket.io");
const authRouter = require("./routes/auth");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const socketAuth = require("./middleware/socketAuth.js");
const GeneralChat = require("./models/generalChatModel.js");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://nexachat-virid.vercel.app"],
    credentials: true,
  }),
);

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: ["http://localhost:5173", "https://nexachat-virid.vercel.app"],
    credentials: true,
  },
});

io.use(socketAuth);

const onlineUsers = new Map();

io.on("connection", (socket) => {
  const user = socket.user;

  const onlineUser = {
    userId: user._id,
    name: user.name,
    avatar: user.avatar,
    socketId: socket.id,
  };

  onlineUsers.set(user._id.toString(), onlineUser);

  socket.join("general");

  console.log("User connected:", socket.user.name);
  console.log("Online users:", onlineUsers.size);

  io.emit("userOnline", onlineUser);

  socket.on("getGeneralMessages", async () => {
    try {
      const allGeneralMessage = await GeneralChat.find()
        .populate("sender", "name avatar")
        .sort({ createAt: 1 });
      io.to("general").emit("generalMessages", allGeneralMessage);
    } catch (error) {
      socket.emit("generalChatError", error.message);
    }
  });

  socket.on("sendGeneralMessage", async ({ message }) => {
    try {
      const newMessage = await GeneralChat.create({
        sender: socket.user._id,
        message,
      });

      const populatedMessage = await newMessage.populate(
        "sender",
        "name avatar",
      );

      io.emit("newGeneralMessage", populatedMessage);
    } catch (error) {
      socket.emit("generalChatError", error.message);
    }
  });

  // NEW USER ko current complete list
  socket.emit("onlineUsers", Array.from(onlineUsers.values()));

  // Baaki connected users ko batao ki new user aaya
  socket.broadcast.emit("userOnline", onlineUser);

  socket.on("typing", () => {
    socket.broadcast.emit("userTyping", {
      userId: socket.user._id.toString(),
      name: socket.user.name,
      avatar: socket.user.avatar,
    });
  });

  socket.on("stopTyping", () => {
    socket.broadcast.emit("userStopTyping", {
      userId: socket.user._id.toString(),
    });
  });

  socket.on("connect_error", (err) => {
    console.log("Error occur during socket connection", err);
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.user.id.toString());
    console.log(`User disconnected : ${socket.user.name}`);
    console.log("Online users:", onlineUsers.size);
    io.emit("userOffline", {
      userId: user._id,
    });
  });
});

app.use("/auth", authRouter);

mongoose.connect(process.env.DB_URL).then(() => {
  console.log("datavse connected successfully");
  server.listen(4000, () => {
    console.log("server run on port 4000");
  });
});
