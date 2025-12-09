import React, { useEffect, useState, useRef } from "react";
import { Card, Form, Button, Spinner } from "react-bootstrap";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

// SOCKET FIX: USE BACKEND URL
const socket = io("https://YOUR-BACKEND-RENDER-LINK", {
  transports: ["websocket"],
  withCredentials: true,
});

const ChatScreen = ({ selectedChat }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user?._id) {
      socket.emit("join", user._id);
    }
  }, [user]);

  // Load chat messages
  useEffect(() => {
    if (!selectedChat) return;
    setMessages(selectedChat.messages || []);
  }, [selectedChat]);

  // REAL-TIME UPDATE
  useEffect(() => {
    const handler = ({ from, content, chatId }) => {
      if (!selectedChat) return;
      if (chatId !== selectedChat._id) return;

      setMessages((prev) => [...prev, { sender: { _id: from }, content }]);
    };

    socket.on("receiveMessage", handler);
    return () => socket.off("receiveMessage", handler);
  }, [selectedChat]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedChat) {
    return (
      <Card className="h-100">
        <Card.Body className="d-flex align-items-center justify-content-center text-muted">
          Select a chat from the left
        </Card.Body>
      </Card>
    );
  }

  const otherUser = selectedChat.users.find((u) => u._id !== user._id);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);

    try {
      await api.post(`/chats/${selectedChat._id}/messages`, {
        content: text,
      });

      socket.emit("sendMessage", {
        from: user._id,
        to: otherUser._id,
        content: text,
        chatId: selectedChat._id,
      });

      setMessages((prev) => [
        ...prev,
        { sender: { _id: user._id }, content: text },
      ]);

      setText("");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <Card style={{ height: "400px", display: "flex", flexDirection: "column" }}>
      <Card.Header>
        <strong>{otherUser?.name}</strong>
      </Card.Header>

      <Card.Body style={{ overflowY: "auto", backgroundColor: "#f8f9fa" }}>
        {messages.map((m, i) => (
          <div
            key={i}
            className="mb-1"
            style={{
              display: "flex",
              justifyContent: m.sender._id === user._id ? "flex-end" : "flex-start",
            }}
          >
            <span
              style={{
                padding: "6px 10px",
                borderRadius: "12px",
                backgroundColor:
                  m.sender._id === user._id ? "#d1e7dd" : "#e2e3e5",
              }}
            >
              {m.content}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </Card.Body>

      <Card.Footer>
        <Form onSubmit={sendMessage} className="d-flex gap-2">
          <Form.Control
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </Button>
        </Form>
      </Card.Footer>
    </Card>
  );
};

export default ChatScreen;
