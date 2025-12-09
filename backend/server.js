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
    origin: "*", // Allow all for now (you will tighten later)
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Join user's private room
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  // Send chat messages
  socket.on("sendMessage", async ({ from, to, content, chatId }) => {
    try {
      let chat = await Chat.findOne({
        users: { $all: [from, to] },
      });

      // Create chat if not exist
      if (!chat) {
        chat = await Chat.create({ users: [from, to], messages: [] });
      }

      // Add message to DB
      const message = { sender: from, content };
      chat.messages.push(message);
      await chat.save();

      // Emit to both users
      io.to(to).emit("receiveMessage", {
        from,
        content,
        chatId: chat._id,
      });

      io.to(from).emit("receiveMessage", {
        from,
        content,
        chatId: chat._id,
      });

    } catch (error) {
      console.error("sendMessage error:", error);
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
