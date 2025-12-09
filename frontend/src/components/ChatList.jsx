import React, { useEffect, useState } from "react";
import { ListGroup } from "react-bootstrap";
import api from "../api/axiosInstance";
import { io } from "socket.io-client";

// 🔥 MUST MATCH SERVER URL
const socket = io("https://social-media-app-fh18.onrender.com", {
  transports: ["websocket"],
});

const ChatList = ({ onSelectChat }) => {
  const [chats, setChats] = useState([]);

  const fetchChats = async () => {
    const { data } = await api.get("/chats");
    setChats(data);
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // 🔥 Auto refresh chat list on new message
  useEffect(() => {
    socket.on("receiveMessage", () => {
      fetchChats();
    });

    return () => socket.off("receiveMessage");
  }, []);

  return (
    <ListGroup>
      {chats.map((chat) => (
        <ListGroup.Item key={chat._id} action onClick={() => onSelectChat(chat)}>
          {chat.users.map((u) => u.name).join(", ")}
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default ChatList;
