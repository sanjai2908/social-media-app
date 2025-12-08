import express from "express";
import multer from "multer";
import path from "path";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMe,
  updateMe,
  uploadProfilePic,
  searchUsers,
  followUser,
  unfollowUser,
  getUserProfile,
} from "../controllers/userController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/profile");
  },
  filename(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.post("/me/profile-pic", protect, upload.single("image"), uploadProfilePic);
router.get("/search", protect, searchUsers);
router.post("/:id/follow", protect, followUser);
router.post("/:id/unfollow", protect, unfollowUser);
router.get("/:id", protect, getUserProfile);

export default router;
