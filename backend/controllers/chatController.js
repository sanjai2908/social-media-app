import Chat from "../models/chatModel.js";

export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.user._id })
      .populate("users", "name profilePic")
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getChatWithUser = async (req, res) => {
  try {
    const { userId } = req.params;
    let chat = await Chat.findOne({
      users: { $all: [req.user._id, userId] },
    }).populate("users", "name profilePic");

    if (!chat) {
      chat = await Chat.create({ users: [req.user._id, userId], messages: [] });
      chat = await chat.populate("users", "name profilePic");
    }

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    let chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const message = { sender: req.user._id, content, seen: false };
    chat.messages.push(message);
    await chat.save();
    
    const savedMessage = chat.messages[chat.messages.length - 1];
    
    await chat.populate("messages.sender", "name profilePic");
    
    res.status(201).json(savedMessage);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
