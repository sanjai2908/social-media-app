import React, { useEffect, useState, useRef } from "react";
import { Card, Form, Button, Spinner } from "react-bootstrap";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

// 🔥 FIXED SOCKET CONNECTION
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
    if (user?._id) {
      socket.emit("join", user._id);
    }
  }, [user]);

  // Load previous chat history
  useEffect(() => {
    if (!selectedChat) return;
    setMessages(selectedChat.messages || []);
  }, [selectedChat]);

  // Receive live messages
  useEffect(() => {
    const handler = ({ from, content, chatId }) => {
      if (!selectedChat) return;
      if (chatId !== selectedChat._id) return;

      setMessages((prev) => [...prev, { sender: { _id: from }, content }]);
    };

    socket.on("receiveMessage", handler);
    return () => socket.off("receiveMessage", handler);
  }, [selectedChat]);

  // Auto scroll to bottom
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
        <div className="text-muted small">{otherUser?.email}</div>
      </Card.Header>

      <Card.Body style={{ overflowY: "auto", backgroundColor: "#f8f9fa" }}>
        {messages.map((m, i) => {
          const isMe = m.sender?._id === user._id;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: isMe ? "flex-end" : "flex-start",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: "12px",
                  backgroundColor: isMe ? "#d1e7dd" : "#e2e3e5",
                }}
              >
                {m.content}
              </span>
            </div>
          );
        })}
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
