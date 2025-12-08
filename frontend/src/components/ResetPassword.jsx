import React, { useState } from "react";
import { Form, Button, Card, Container } from "react-bootstrap";
import api from "../api/axiosInstance";

const ResetPassword = () => {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submitReset = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/reset-password", {
        token,
        password,
      });
      setMsg(data.message);
    } catch (err) {
      setMsg(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <Container style={{ maxWidth: "500px" }}>
      <Card>
        <Card.Body>
          <Card.Title>Reset Password</Card.Title>
          {msg && <div className="mb-2">{msg}</div>}
          <Form onSubmit={submitReset}>
            <Form.Group className="mb-3">
              <Form.Label>Reset Token</Form.Label>
              <Form.Control
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter token from email"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </Form.Group>
            <Button type="submit">Reset Password</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ResetPassword;
