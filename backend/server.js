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
const Message = require("./models/Message.js");
const Group = require("./models/Group.js");
const GroupMessage = require("./models/GroupMessage.js");
const User = require("./models/user.js");
const Product = require("./models/Product.js");
const Order = require("./models/Order.js");
const Reel = require("./models/Reel.js");
const Story = require("./models/Story.js");

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
  socket.join(user._id.toString()); // Private channel for this user

  // Join all group rooms the user belongs to
  Group.find({ members: user._id })
    .then((userGroups) => {
      userGroups.forEach((group) => {
        socket.join(group._id.toString());
      });
    })
    .catch((err) => console.error("Error joining group rooms:", err.message));

  console.log("User connected:", socket.user.name);
  console.log("Online users:", onlineUsers.size);

  io.emit("userOnline", onlineUser);

  // ================= GENERAL CHAT =================
  socket.on("getGeneralMessages", async () => {
    try {
      const allGeneralMessage = await GeneralChat.find({ deletedBy: { $ne: user._id } })
        .populate("sender", "name avatar")
        .sort({ createdAt: 1 });
      io.to("general").emit("generalMessages", allGeneralMessage);
    } catch (error) {
      socket.emit("generalChatError", error.message);
    }
  });

  socket.on("sendGeneralMessage", async ({ message, replyTo }) => {
    try {
      const newMessage = await GeneralChat.create({
        sender: socket.user._id,
        message,
        replyTo,
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

  // ================= PRIVATE CHAT =================
  socket.on("getAllUsers", async () => {
    try {
      const allUsers = await User.find({ _id: { $ne: user._id } }).select(
        "name avatar email"
      );
      socket.emit("allUsers", allUsers);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("getChatPartners", async () => {
    try {
      const messages = await Message.find({
        $or: [{ sender: user._id }, { receiver: user._id }],
      }).sort({ createdAt: -1 });

      const partnerIds = new Set();
      messages.forEach((msg) => {
        if (msg.sender.toString() !== user._id.toString()) {
          partnerIds.add(msg.sender.toString());
        }
        if (msg.receiver.toString() !== user._id.toString()) {
          partnerIds.add(msg.receiver.toString());
        }
      });

      const partners = await User.find({
        _id: { $in: Array.from(partnerIds) },
      }).select("name avatar");
      socket.emit("chatPartners", partners);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("getPrivateMessages", async ({ targetUserId }) => {
    try {
      // Mark messages as seen when fetched
      await Message.updateMany(
        { sender: targetUserId, receiver: user._id, seen: false },
        { seen: true }
      );
      // Notify sender that they've been read
      io.to(targetUserId.toString()).emit("messagesSeen", {
        seenBy: user._id,
        senderId: targetUserId,
        receiverId: user._id,
      });

      const allPrivateMessages = await Message.find({
        $or: [
          { sender: user._id, receiver: targetUserId },
          { sender: targetUserId, receiver: user._id },
        ],
        deletedBy: { $ne: user._id }
      })
        .populate("sender receiver", "name avatar")
        .sort({ createdAt: 1 });
      socket.emit("privateMessages", allPrivateMessages);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("sendPrivateMessage", async ({ receiverId, message, replyTo }) => {
    try {
      const newMessage = await Message.create({
        sender: user._id,
        receiver: receiverId,
        message,
        replyTo,
      });

      const populatedMessage = await newMessage.populate(
        "sender receiver",
        "name avatar",
      );

      // Emit to receiver's private room
      io.to(receiverId.toString()).emit("newPrivateMessage", populatedMessage);
      // Emit back to sender
      socket.emit("newPrivateMessage", populatedMessage);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("privateTyping", ({ receiverId }) => {
    socket.broadcast.to(receiverId.toString()).emit("userTyping", {
      userId: user._id.toString(),
      name: user.name,
      avatar: user.avatar,
      chatType: "private",
    });
  });

  socket.on("privateStopTyping", ({ receiverId }) => {
    socket.broadcast.to(receiverId.toString()).emit("userStopTyping", {
      userId: user._id.toString(),
      chatType: "private",
    });
  });

  // ================= GROUP CHAT =================
  socket.on("getGroups", async () => {
    try {
      const userGroups = await Group.find({ members: user._id }).populate(
        "members creator",
        "name avatar"
      );
      socket.emit("groupsList", userGroups);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("createGroup", async ({ name, members }) => {
    try {
      const newGroup = await Group.create({
        name,
        members: [...members, user._id],
        creator: user._id,
      });

      const populatedGroup = await newGroup.populate(
        "members creator",
        "name avatar"
      );

      // Notify all members via their individual rooms
      populatedGroup.members.forEach((member) => {
        io.to(member._id.toString()).emit("groupCreated", populatedGroup);
      });
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("joinGroup", ({ groupId }) => {
    socket.join(groupId);
  });

  socket.on("getGroupMessages", async ({ groupId }) => {
    try {
      // Mark as seen by adding user._id to seenBy
      await GroupMessage.updateMany(
        { group: groupId, seenBy: { $ne: user._id } },
        { $addToSet: { seenBy: user._id } }
      );

      const messages = await GroupMessage.find({
        group: groupId,
        deletedBy: { $ne: user._id }
      })
        .populate("sender", "name avatar")
        .sort({ createdAt: 1 });
      socket.emit("groupMessages", messages);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("sendGroupMessage", async ({ groupId, message, replyTo }) => {
    try {
      const newMessage = await GroupMessage.create({
        group: groupId,
        sender: user._id,
        message,
        replyTo,
      });

      const populatedMessage = await newMessage.populate(
        "sender",
        "name avatar",
      );

      io.to(groupId.toString()).emit("newGroupMessage", populatedMessage);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("groupTyping", ({ groupId }) => {
    socket.broadcast.to(groupId.toString()).emit("userTyping", {
      userId: user._id.toString(),
      name: user.name,
      avatar: user.avatar,
      groupId,
      chatType: "group",
    });
  });

  socket.on("groupStopTyping", ({ groupId }) => {
    socket.broadcast.to(groupId.toString()).emit("userStopTyping", {
      userId: user._id.toString(),
      groupId,
      chatType: "group",
    });
  });

  // ================= E-COMMERCE SHOP =================
  socket.on("getSellerProducts", async ({ sellerId }) => {
    try {
      const products = await Product.find({ seller: sellerId }).sort({ createdAt: -1 });
      socket.emit("sellerProducts", products);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("addProduct", async ({ name, description, price, image }) => {
    try {
      const newProduct = await Product.create({
        seller: user._id,
        name,
        description,
        price,
        image: image || "",
      });
      const products = await Product.find({ seller: user._id }).sort({ createdAt: -1 });
      socket.emit("sellerProducts", products);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("deleteProduct", async ({ productId }) => {
    try {
      await Product.deleteOne({ _id: productId, seller: user._id });
      const products = await Product.find({ seller: user._id }).sort({ createdAt: -1 });
      socket.emit("sellerProducts", products);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("createOrder", async ({ sellerId, productId, quantity }) => {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        return socket.emit("chatError", "Product not found");
      }
      const qty = quantity || 1;
      const totalPrice = product.price * qty;

      const newOrder = await Order.create({
        buyer: user._id,
        seller: sellerId,
        product: productId,
        quantity: qty,
        totalPrice,
        status: "pending",
      });

      const populatedOrder = await newOrder.populate("buyer seller product");

      // 1. Send receipt message in the private chat
      const chatMessage = await Message.create({
        sender: user._id,
        receiver: sellerId,
        message: `🛒 [ORDER PLACED] I placed an order for "${product.name}" (Qty: ${qty}) - Total: $${totalPrice.toFixed(2)}. Status: Pending.`,
      });

      const populatedMessage = await chatMessage.populate("sender receiver", "name avatar");

      // Emit the chat message to both rooms
      io.to(sellerId.toString()).emit("newPrivateMessage", populatedMessage);
      socket.emit("newPrivateMessage", populatedMessage);

      // 2. Notify the seller of the new order if they are online
      io.to(sellerId.toString()).emit("newOrderAlert", populatedOrder);

      // 3. Emit success and fresh buyer orders list back to the buyer
      const buyerOrders = await Order.find({ buyer: user._id })
        .populate("seller product")
        .sort({ createdAt: -1 });
      socket.emit("buyerOrdersList", buyerOrders);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("getSellerOrders", async () => {
    try {
      const orders = await Order.find({ seller: user._id })
        .populate("buyer product")
        .sort({ createdAt: -1 });
      socket.emit("sellerOrdersList", orders);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("getBuyerOrders", async () => {
    try {
      const orders = await Order.find({ buyer: user._id })
        .populate("seller product")
        .sort({ createdAt: -1 });
      socket.emit("buyerOrdersList", orders);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("updateOrderStatus", async ({ orderId, status }) => {
    try {
      const order = await Order.findOneAndUpdate(
        { _id: orderId, seller: user._id },
        { status },
        { new: true }
      ).populate("buyer seller product");

      if (!order) {
        return socket.emit("chatError", "Order not found");
      }

      // 1. Send status update message in the private chat
      const chatMessage = await Message.create({
        sender: user._id,
        receiver: order.buyer._id,
        message: `📦 [ORDER UPDATE] Order for "${order.product.name}" status updated to: ${status.toUpperCase()}.`,
      });

      const populatedMessage = await chatMessage.populate("sender receiver", "name avatar");

      // Emit to both
      io.to(order.buyer._id.toString()).emit("newPrivateMessage", populatedMessage);
      socket.emit("newPrivateMessage", populatedMessage);

      // 2. Notify the buyer of the status update if online
      io.to(order.buyer._id.toString()).emit("orderStatusUpdated", order);

      // 3. Emit updated seller orders list to seller
      const sellerOrders = await Order.find({ seller: user._id })
        .populate("buyer product")
        .sort({ createdAt: -1 });
      socket.emit("sellerOrdersList", sellerOrders);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  // ================= ADVANCED MESSAGING =================
  socket.on("markAsSeen", async ({ chatType, senderId, groupId }) => {
    try {
      if (chatType === "private" && senderId) {
        await Message.updateMany(
          { sender: senderId, receiver: user._id, seen: false },
          { seen: true }
        );
        io.to(senderId.toString()).emit("messagesSeen", { seenBy: user._id, senderId, receiverId: user._id });
        socket.emit("messagesSeen", { seenBy: user._id, senderId, receiverId: user._id });
      } else if (chatType === "group" && groupId) {
        await GroupMessage.updateMany(
          { group: groupId, seenBy: { $ne: user._id } },
          { $addToSet: { seenBy: user._id } }
        );
        io.to(groupId.toString()).emit("groupMessagesSeen", { seenBy: user._id, groupId });
      }
    } catch (error) {
      console.error("markAsSeen error:", error);
    }
  });

  socket.on("reactToMessage", async ({ messageId, emoji, chatType }) => {
    try {
      let Model;
      if (chatType === "general") Model = GeneralChat;
      else if (chatType === "private") Model = Message;
      else if (chatType === "group") Model = GroupMessage;
      else return;

      const message = await Model.findById(messageId);
      if (!message) return;

      const existingReactionIndex = message.reactions.findIndex(
        (r) => r.user.toString() === user._id.toString()
      );

      if (existingReactionIndex > -1) {
        if (message.reactions[existingReactionIndex].emoji === emoji) {
          message.reactions.splice(existingReactionIndex, 1);
        } else {
          message.reactions[existingReactionIndex].emoji = emoji;
        }
      } else {
        message.reactions.push({ user: user._id, emoji });
      }

      await message.save();
      const populatedMessage = await message.populate(
        chatType === "private" ? "sender receiver" : "sender",
        "name avatar"
      );

      if (chatType === "general") {
        io.emit("messageUpdated", { chatType, message: populatedMessage });
      } else if (chatType === "private") {
        io.to(message.sender._id.toString()).emit("messageUpdated", { chatType, message: populatedMessage });
        io.to(message.receiver._id.toString()).emit("messageUpdated", { chatType, message: populatedMessage });
      } else if (chatType === "group") {
        io.to(message.group.toString()).emit("messageUpdated", { chatType, message: populatedMessage });
      }
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("deleteMessage", async ({ messageId, chatType, deleteType }) => {
    try {
      let Model;
      if (chatType === "general") Model = GeneralChat;
      else if (chatType === "private") Model = Message;
      else if (chatType === "group") Model = GroupMessage;
      else return;

      const message = await Model.findById(messageId);
      if (!message) return;

      if (deleteType === "for_me") {
        if (!message.deletedBy.includes(user._id)) {
          message.deletedBy.push(user._id);
          await message.save();
        }
        socket.emit("messageDeletedForMe", { messageId });
      } else if (deleteType === "for_everyone") {
        const msgSenderId = message.sender.toString();
        if (msgSenderId !== user._id.toString()) {
          return socket.emit("chatError", "Unauthorized delete request");
        }

        message.isDeleted = true;
        message.message = "This message was deleted";
        await message.save();

        const populatedMessage = await message.populate(
          chatType === "private" ? "sender receiver" : "sender",
          "name avatar"
        );

        if (chatType === "general") {
          io.emit("messageUpdated", { chatType, message: populatedMessage });
        } else if (chatType === "private") {
          io.to(message.sender._id.toString()).emit("messageUpdated", { chatType, message: populatedMessage });
          io.to(message.receiver._id.toString()).emit("messageUpdated", { chatType, message: populatedMessage });
        } else if (chatType === "group") {
          io.to(message.group.toString()).emit("messageUpdated", { chatType, message: populatedMessage });
        }
      }
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  // NEW USER ko current complete list
  socket.emit("onlineUsers", Array.from(onlineUsers.values()));

  socket.on("getOnlineUsers", () => {
    socket.emit("onlineUsers", Array.from(onlineUsers.values()));
  });

  // Baaki connected users ko batao ki new user aaya
  socket.broadcast.emit("userOnline", onlineUser);

  socket.on("typing", () => {
    socket.broadcast.emit("userTyping", {
      userId: socket.user._id.toString(),
      name: socket.user.name,
      avatar: socket.user.avatar,
      chatType: "general",
    });
  });

  socket.on("stopTyping", () => {
    socket.broadcast.emit("userStopTyping", {
      userId: socket.user._id.toString(),
      chatType: "general",
    });
  });

  socket.on("connect_error", (err) => {
    console.log("Error occur during socket connection", err);
  });

  // ================= LEAVE GROUP =================
  socket.on("leaveGroup", async ({ groupId }) => {
    try {
      const group = await Group.findById(groupId);
      if (!group) return socket.emit("chatError", "Group not found");

      group.members = group.members.filter(
        (m) => m.toString() !== user._id.toString()
      );

      if (group.members.length === 0) {
        await Group.deleteOne({ _id: groupId });
      } else {
        if (group.creator.toString() === user._id.toString()) {
          group.creator = group.members[0];
        }
        await group.save();
      }

      const systemMsg = await GroupMessage.create({
        group: groupId,
        sender: user._id,
        message: `🚪 ${user.name} has left the group.`,
      });

      const populatedMsg = await systemMsg.populate("sender", "name avatar");
      io.to(groupId.toString()).emit("newGroupMessage", populatedMsg);

      socket.leave(groupId.toString());

      const userGroups = await Group.find({ members: user._id }).populate(
        "members creator",
        "name avatar"
      );
      socket.emit("groupsList", userGroups);

      io.to(groupId.toString()).emit("groupUpdated", { groupId });
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  // ================= INSTAGRAM REELS =================
  socket.on("getReels", async () => {
    try {
      const reels = await Reel.find({})
        .populate("seller", "name avatar bio shopName shopImage role whatsappAbout instagramLink whatsappLink")
        .populate("product")
        .populate("comments.user", "name avatar")
        .sort({ createdAt: -1 });
      socket.emit("reelsList", reels);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("addReel", async ({ videoUrl, caption, productId }) => {
    try {
      await Reel.create({
        seller: user._id,
        videoUrl,
        caption: caption || "",
        product: productId || null,
      });

      const reels = await Reel.find({})
        .populate("seller", "name avatar bio shopName shopImage role whatsappAbout instagramLink whatsappLink")
        .populate("product")
        .populate("comments.user", "name avatar")
        .sort({ createdAt: -1 });
      io.emit("reelsList", reels);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("likeReel", async ({ reelId }) => {
    try {
      const reel = await Reel.findById(reelId);
      if (!reel) return socket.emit("chatError", "Reel not found");

      const index = reel.likes.indexOf(user._id);
      if (index > -1) {
        reel.likes.splice(index, 1);
      } else {
        reel.likes.push(user._id);
      }
      await reel.save();

      const updatedReel = await Reel.findById(reelId)
        .populate("seller", "name avatar bio shopName shopImage role whatsappAbout instagramLink whatsappLink")
        .populate("product")
        .populate("comments.user", "name avatar");

      io.emit("reelUpdated", updatedReel);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("commentReel", async ({ reelId, text }) => {
    try {
      if (!text || !text.trim()) return;
      const reel = await Reel.findById(reelId);
      if (!reel) return socket.emit("chatError", "Reel not found");

      reel.comments.push({
        user: user._id,
        text: text.trim(),
      });
      await reel.save();

      const updatedReel = await Reel.findById(reelId)
        .populate("seller", "name avatar bio shopName shopImage role whatsappAbout instagramLink whatsappLink")
        .populate("product")
        .populate("comments.user", "name avatar");

      io.emit("reelUpdated", updatedReel);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  // ================= FOLLOW SYSTEM =================
  socket.on("followUser", async ({ targetUserId }) => {
    try {
      if (targetUserId === user._id.toString()) {
        return socket.emit("chatError", "You cannot follow yourself");
      }

      const targetUser = await User.findById(targetUserId);
      const currentUser = await User.findById(user._id);

      if (!targetUser || !currentUser) {
        return socket.emit("chatError", "User not found");
      }

      const isFollowing = currentUser.following.includes(targetUserId);

      if (isFollowing) {
        currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
        targetUser.followers = targetUser.followers.filter(id => id.toString() !== user._id.toString());
      } else {
        currentUser.following.push(targetUserId);
        targetUser.followers.push(user._id);
      }

      await currentUser.save();
      await targetUser.save();

      socket.emit("followStatusUpdated", {
        targetUserId,
        isFollowing: !isFollowing,
        followersCount: targetUser.followers.length,
        followingCount: targetUser.following.length
      });

      io.emit("userFollowersUpdated", {
        userId: targetUserId,
        followersCount: targetUser.followers.length
      });
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  // ================= WHATSAPP STATUS / STORIES =================
  socket.on("addStory", async ({ mediaUrl, caption }) => {
    try {
      if (!mediaUrl) return socket.emit("chatError", "Story media URL is required");

      await Story.create({
        user: user._id,
        mediaUrl,
        caption: caption || ""
      });

      const activeStories = await Story.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).populate("user", "name avatar").sort({ createdAt: 1 });

      io.emit("storiesList", activeStories);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("getStories", async () => {
    try {
      const activeStories = await Story.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).populate("user", "name avatar").sort({ createdAt: 1 });
      socket.emit("storiesList", activeStories);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("deleteStory", async ({ storyId }) => {
    try {
      await Story.deleteOne({ _id: storyId, user: user._id });
      const activeStories = await Story.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).populate("user", "name avatar").sort({ createdAt: 1 });
      io.emit("storiesList", activeStories);
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  // ================= PRODUCT REVIEWS =================
  socket.on("submitReview", async ({ productId, rating, comment }) => {
    try {
      const product = await Product.findById(productId);
      if (!product) return socket.emit("chatError", "Product not found");

      product.reviews = product.reviews.filter(r => r.user.toString() !== user._id.toString());

      product.reviews.push({
        user: user._id,
        rating: Math.min(5, Math.max(1, rating)),
        comment: comment || ""
      });

      const total = product.reviews.reduce((sum, r) => sum + r.rating, 0);
      product.averageRating = total / product.reviews.length;

      await product.save();

      const populatedProduct = await Product.findById(productId)
        .populate("reviews.user", "name avatar");

      const sellerProducts = await Product.find({ seller: product.seller }).sort({ createdAt: -1 });
      io.emit("productReviewSubmitted", { product: populatedProduct, sellerProducts });
    } catch (error) {
      socket.emit("chatError", error.message);
    }
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.user._id.toString());
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
