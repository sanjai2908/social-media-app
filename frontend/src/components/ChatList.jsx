import React, { useEffect, useState } from "react";
import { ListGroup } from "react-bootstrap";
import api from "../api/axiosInstance";
import { io } from "socket.io-client";

const socket = io("https://YOUR-BACKEND-RENDER-LINK");

const ChatList = ({ onSelectChat }) => {
  const [chats, setChats] = useState([]);

  const fetchChats = async () => {
    const { data } = await api.get("/chats");
    setChats(data);
  };

  useEffect(() => {
    fetchChats();
  }, []);

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
