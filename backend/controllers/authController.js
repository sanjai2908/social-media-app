import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import User from "../models/userModel.js";

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in .env");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export const signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // check user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);

    // duplicate email error from Mongo
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      return res.status(400).json({ message: "Email already registered" });
    }

    return res
      .status(500)
      .json({ message: err.message || "Server error during signup" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.twoFactorEnabled) {
      if (!otp) {
        return res.status(200).json({
          requires2FA: true,
          message: "OTP required",
        });
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: otp,
      });
      if (!verified) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
    }

    const token = generateToken(user._id);
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      twoFactorEnabled: user.twoFactorEnabled,
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

export const generate2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = speakeasy.generateSecret({
      name: `SocialMediaApp (${user.email})`,
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    const otpauthUrl = secret.otpauth_url;
    const qrDataUrl = await qrcode.toDataURL(otpauthUrl);

    return res.json({
      qrDataUrl,
      secret: secret.base32,
    });
  } catch (err) {
    console.error("2FA GENERATE ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

export const enable2FA = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: "2FA not initialized" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: otp,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.twoFactorEnabled = true;
    await user.save();

    return res.json({ message: "2FA enabled successfully" });
  } catch (err) {
    console.error("2FA ENABLE ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};
