import React, { useEffect, useState, useRef } from "react";
import { Card, Form, Button, Spinner } from "react-bootstrap";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

const socket = io("https://social-media-app-fh18.onrender.com", {
  transports: ["websocket"],
  withCredentials: true,
});

const ChatScreen = ({ selectedChat }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Join my private socket room
  useEffect(() => {
    if (user?._id) socket.emit("join", user._id);
  }, [user]);

  // Load previous chat history
  useEffect(() => {
    if (!selectedChat) return;
    setMessages(selectedChat.messages || []);
  }, [selectedChat]);

  // Receive live messages
  useEffect(() => {
    const handler = (msg) => {
      if (!selectedChat) return;
      if (msg.chatId !== selectedChat._id) return;

      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receiveMessage", handler);
    return () => socket.off("receiveMessage", handler);
  }, [selectedChat]);

  // Handle message seen updates
  useEffect(() => {
    socket.on("messageSeen", ({ chatId }) => {
      if (selectedChat && selectedChat._id === chatId) {
        setMessages((prev) =>
          prev.map((m, index) =>
            index === prev.length - 1 ? { ...m, seen: true } : m
          )
        );
      }
    });
  }, [selectedChat]);

  // Auto scroll
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

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);

    try {
      const res = await api.post(`/chats/${selectedChat._id}/messages`, {
        content: text,
      });

      const newMsg = res.data; // Already correct format
      setMessages((prev) => [...prev, newMsg]);

      socket.emit("sendMessage", {
        from: user._id,
        to: otherUser._id,
        content: text,
        chatId: selectedChat._id,
      });

      setText("");

      // Tell backend "message is seen" immediately if chat is open
      socket.emit("messageSeen", { chatId: selectedChat._id });

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  // Bubble Style Helper
  const messageBubble = (m) => {
    const senderId = typeof m.sender === "string" ? m.sender : m.sender?._id;
    const isMe = senderId === user._id;

    return (
      <div
        style={{
          display: "flex",
          justifyContent: isMe ? "flex-end" : "flex-start",
          marginBottom: "6px",
        }}
      >
        <div
          style={{
            maxWidth: "70%",
            padding: "10px 14px",
            borderRadius: "14px",
            backgroundColor: isMe ? "#d1f7c4" : "#e9ecef",
            color: "#000",
            position: "relative",
          }}
        >
          {m.content}

          {/* Seen blue ticks */}
          {isMe && (
            <div
              style={{
                fontSize: "12px",
                marginTop: "4px",
                textAlign: "right",
                opacity: 0.7,
              }}
            >
              {m.seen ? (
                <span style={{ color: "#0d6efd" }}>✓✓ Seen</span>
              ) : (
                <span>✓✓</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card
      style={{
        height: "400px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Card.Header style={{ background: "#f0f2f5" }}>
        <strong>{otherUser?.name}</strong>
        <div className="text-muted small">{otherUser?.email}</div>
      </Card.Header>

      <Card.Body
        style={{
          overflowY: "auto",
          backgroundColor: "#f8f9fa",
          padding: "10px",
        }}
      >
        {messages.map((m, i) => (
          <div key={i}>{messageBubble(m)}</div>
        ))}

        <div ref={messagesEndRef}></div>
      </Card.Body>

      <Card.Footer>
        <Form onSubmit={sendMessage} className="d-flex gap-2">
          <Form.Control
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
          />

          <Button type="submit" disabled={loading || !text.trim()}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" /> Sending...
              </>
            ) : (
              "Send"
            )}
          </Button>
        </Form>
      </Card.Footer>
    </Card>
  );
};

export default ChatScreen;
