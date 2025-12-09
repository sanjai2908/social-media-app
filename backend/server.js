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

// ------------ SOCKET.IO --------------
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Join specific user room
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  // Send and receive messages
  socket.on("sendMessage", async ({ from, to, content }) => {
    try {
      let chat = await Chat.findOne({
        users: { $all: [from, to] },
      });

      if (!chat) {
        chat = await Chat.create({ users: [from, to], messages: [] });
      }

      const message = { sender: from, content };
      chat.messages.push(message);
      await chat.save();

      // Send real-time message to both users
      io.to(to).emit("receiveMessage", { from, content, chatId: chat._id });
      io.to(from).emit("receiveMessage", { from, content, chatId: chat._id });

    } catch (err) {
      console.error("Socket sendMessage error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ------------ EXPRESS CONFIG --------------

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.get("/", (req, res) => res.send("API is running"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chats", chatRoutes);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
