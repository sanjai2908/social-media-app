import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

import Chat from "./models/chatModel.js";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

// ------------------ SOCKET.IO --------------------
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Join user's private room
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  // ------------------- SEND MESSAGE --------------------
  socket.on("sendMessage", async ({ from, to, content, chatId }) => {
    try {
      // Get chat
      let chat = await Chat.findById(chatId);

      // Create chat if not exist
      if (!chat) {
        chat = await Chat.create({ users: [from, to], messages: [] });
      }

      // Create new message
      const message = {
        sender: from,
        content,
        seen: false,
      };

      chat.messages.push(message);
      await chat.save();

      // Build final message format for frontend
      const finalMessage = {
        sender: { _id: from },
        content,
        seen: false,
        chatId: chat._id,
      };

      // Emit to receiver
      io.to(to).emit("receiveMessage", finalMessage);

      // Emit to sender
      io.to(from).emit("receiveMessage", finalMessage);

    } catch (error) {
      console.error("sendMessage error:", error);
    }
  });

  // ------------------- MESSAGE SEEN --------------------
  socket.on("messageSeen", async ({ chatId }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      // Mark last message as seen
      const lastMessage = chat.messages[chat.messages.length - 1];
      lastMessage.seen = true;

      await chat.save();

      // Notify both users
      const users = chat.users.map((id) => id.toString());
      users.forEach((uid) => io.to(uid).emit("messageSeen", { chatId }));
    } catch (err) {
      console.error("messageSeen error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ------------------ EXPRESS CONFIG --------------------
app.use(cors());
app.use(express.json());

// Static Uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.get("/", (req, res) => res.send("API is running"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chats", chatRoutes);

// ------------------ START SERVER --------------------
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
