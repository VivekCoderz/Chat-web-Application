const jwt = require("jsonwebtoken");
const User = require("../models/user.js");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "chatapplication2026", {
    expiresIn: "1d",
  });
};

// The live frontend (Vercel) and API (Render) are on different sites, so the
// auth cookie must be SameSite=None + Secure there. That only works over HTTPS,
// so detect HTTPS from the request (Render terminates TLS at its proxy and sets
// x-forwarded-proto) instead of relying on NODE_ENV being set on the host.
const cookieOptions = (req) => {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const isHttps = req.secure || forwardedProto === "https" || process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
  };
};

module.exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      ...cookieOptions(req),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
       message:"Account created successfully",

      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Password invalid",
      });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      ...cookieOptions(req),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login Successful",

      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.logout = async (req, res) => {
  res.clearCookie("token", cookieOptions(req));

  return res.status(200).json({
    success: true,
    message: "Logout Successful",
  });
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const { streamUpload } = require("../middleware/cloudinary.js");

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const resourceType = req.file.mimetype.startsWith("video") ? "video" : "image";
    const result = await streamUpload(req.file.buffer, resourceType);
    return res.status(200).json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar, role, bio, whatsappAbout, shopName, shopImage, instagramLink, whatsappLink } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (role) user.role = role;
    if (bio !== undefined) user.bio = bio;
    if (whatsappAbout !== undefined) user.whatsappAbout = whatsappAbout;
    if (shopName !== undefined) user.shopName = shopName;
    if (shopImage !== undefined) user.shopImage = shopImage;
    if (instagramLink !== undefined) user.instagramLink = instagramLink;
    if (whatsappLink !== undefined) user.whatsappLink = whatsappLink;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
