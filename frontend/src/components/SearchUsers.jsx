import React, { useState } from "react";
import {
  Container,
  Form,
  Button,
  ListGroup,
  Card,
  Badge,
} from "react-bootstrap";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const SearchUsers = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const { user } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const { data } = await api.get(
        `/users/search?q=${encodeURIComponent(query)}`
      );
      setResults(data);
    } catch (err) {
      console.error(err);
      alert("Search failed");
    }
  };

  // ✅ FOLLOW with error handling
  const follow = async (id) => {
    try {
      const { data } = await api.post(`/users/${id}/follow`);
      alert(data.message || "Followed user");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Unable to follow this user";
      alert(msg);
    }
  };

  // ✅ START CHAT defined properly
  const startChat = async (id) => {
    try {
      await api.get(`/chats/with/${id}`);
      alert("Chat created! Now open Chat tab.");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Could not create chat";
      alert(msg);
    }
  };

  // Small helper – first letter avatar
  const getInitial = (name = "") =>
    name.trim().length ? name.trim()[0].toUpperCase() : "?";

  return (
    <Container style={{ maxWidth: "700px" }} className="mt-3">
      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <Card.Title className="mb-0">Search Users</Card.Title>
              <small className="text-muted">
                Find people to follow or start a chat
              </small>
            </div>
            {results.length > 0 && (
              <Badge bg="light" text="dark">
                {results.length} result{results.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <Form onSubmit={handleSearch} className="mb-3">
            <div className="d-flex gap-2">
              <Form.Control
                placeholder="Search by name or email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" variant="primary">
                Search
              </Button>
            </div>
          </Form>

          {results.length === 0 ? (
            <div className="text-muted small">
              Try searching for a friend by their name or email.
            </div>
          ) : (
            <ListGroup variant="flush">
              {results.map((u) => (
                <ListGroup.Item
                  key={u._id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #4e73df, #1cc88a)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 600,
                        marginRight: 10,
                        fontSize: 18,
                        textTransform: "uppercase",
                      }}
                    >
                      {getInitial(u.name)}
                    </div>
                    <div>
                      <div className="fw-semibold">
                        {u.name}{" "}
                        {user && user._id === u._id && (
                          <Badge bg="secondary" className="ms-1">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted small">{u.email}</div>
                    </div>
                  </div>

                  {user && user._id !== u._id && (
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => follow(u._id)}
                      >
                        Follow
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => startChat(u._id)}
                      >
                        Message
                      </Button>
                    </div>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SearchUsers;
