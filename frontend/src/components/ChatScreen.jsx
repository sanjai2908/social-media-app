import React, { useEffect, useState, useRef } from "react";
import { Card, Form, Button, Spinner } from "react-bootstrap";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

const socket = io("https://social-media-app-fh18.onrender.com", {
  autoConnect: true,
});


const ChatScreen = ({ selectedChat }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Join room for this user
  useEffect(() => {
    if (user?._id) {
      socket.emit("join", user._id);
    }
  }, [user]);

  // When chat changes, load its messages
  useEffect(() => {
    if (!selectedChat) return;
    setMessages(selectedChat.messages || []);
  }, [selectedChat]);

  // Listen for incoming messages
  useEffect(() => {
    const handler = ({ from, content, chatId }) => {
      // Only for current chat
      if (!selectedChat || chatId !== selectedChat._id) return;

      // 🔥 IMPORTANT: ignore echoes of our own messages
      if (from === user?._id) return;

      setMessages((prev) => [...prev, { sender: { _id: from }, content }]);
    };

    socket.on("receiveMessage", handler);
    return () => {
      socket.off("receiveMessage", handler);
    };
  }, [selectedChat, user?._id]);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
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
      // Save to DB
      await api.post(`/chats/${selectedChat._id}/messages`, {
        content: text,
      });

      // Emit via socket
      socket.emit("sendMessage", {
        from: user._id,
        to: otherUser?._id,
        content: text,
        chatId: selectedChat._id,
      });

      // Optimistic add (only once, for us)
      setMessages((prev) => [
        ...prev,
        { sender: { _id: user._id }, content: text },
      ]);
      setText("");
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{
        height: "400px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <strong>{otherUser?.name || "Chat"}</strong>
          <div className="text-muted small">
            {otherUser?.email || "Direct message"}
          </div>
        </div>
      </Card.Header>

      <Card.Body
        style={{
          overflowY: "auto",
          backgroundColor: "#f8f9fa",
        }}
      >
        {messages.length === 0 && (
          <div className="text-muted text-center mt-3">
            No messages yet. Say hi 👋
          </div>
        )}

        {messages.map((m, idx) => {
          const isMe = m.sender?._id === user._id;
          return (
            <div
              key={idx}
              className="mb-1 d-flex"
              style={{ justifyContent: isMe ? "flex-end" : "flex-start" }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 10px",
                  borderRadius: 12,
                  backgroundColor: isMe ? "#d1e7dd" : "#e2e3e5",
                  maxWidth: "70%",
                  fontSize: "0.9rem",
                }}
              >
                {m.content}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </Card.Body>

      <Card.Footer>
        <Form onSubmit={sendMessage} className="d-flex gap-2">
          <Form.Control
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message"
          />
          <Button type="submit" disabled={loading || !text.trim()}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Sending
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
