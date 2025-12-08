import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getUserChats,
  getChatWithUser,
  sendMessage,
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/", protect, getUserChats);
router.get("/with/:userId", protect, getChatWithUser);
router.post("/:chatId/messages", protect, sendMessage);

export default router;
