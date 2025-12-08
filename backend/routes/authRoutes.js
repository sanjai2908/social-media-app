import express from "express";
import { signupUser, loginUser, generate2FA, enable2FA } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/2fa/generate", protect, generate2FA);
router.post("/2fa/enable", protect, enable2FA);

export default router;
