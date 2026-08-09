const jwt = require("jsonwebtoken");
const User =  require("../models/user.js");

const socketAuth = async (socket, next) => {
  try {
    // Cookie header
    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
      return next(new Error("Login First"));
    }

    // Cookie se token nikalo
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((cookie) => {
        const [key, ...value] = cookie.split("=");
        return [key, value.join("=")];
      })
    );

    const token = cookies.token;
    
    if (!token) {
        return next(new Error("Authentication required"));
    }
    
    // JWT verify
    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );
    
    // User database se find
    const user = await User.findById(decoded.id).select(
      "_id name avatar"
    );

    if (!user) {
      return next(new Error("User not found"));
    }

    // User ko socket ke saath attach karo
    socket.user = user;

    // Authentication successful
    next();

  } catch (error) {
    console.error("Socket authentication error:", error.message);

    next(new Error("Authentication failed"));
  }
};

module.exports = socketAuth;