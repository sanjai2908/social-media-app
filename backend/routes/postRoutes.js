import express from "express";
import multer from "multer";
import path from "path";
import { protect } from "../middleware/authMiddleware.js";
import {
  createPost,
  getFeedPosts,
  getPostById,
  getUserPosts,
  deletePost,
  addComment,
} from "../controllers/postController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/posts");
  },
  filename(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/", protect, upload.single("image"), createPost);
router.get("/feed", protect, getFeedPosts);
router.get("/user/:userId", protect, getUserPosts);
router.get("/:id", protect, getPostById);
router.delete("/:id", protect, deletePost);
router.post("/:id/comments", protect, addComment);

export default router;
