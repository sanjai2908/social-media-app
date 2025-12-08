import React, { useState } from "react";
import { Form, Button, Card, Container } from "react-bootstrap";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const submitLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
        otp: requires2FA ? otp : undefined,
      });
      if (data.requires2FA) {
        setRequires2FA(true);
        setError("Enter OTP from your Authenticator app");
      } else {
        login(
          { _id: data._id, name: data.name, email: data.email },
          data.token
        );
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <Container style={{ maxWidth: "500px" }}>
      <Card>
        <Card.Body>
          <Card.Title>Login</Card.Title>
          {error && <div className="text-danger mb-2">{error}</div>}
          <Form onSubmit={submitLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </Form.Group>
            <div className="text-end mb-3">
              <a href="/forgot-password" style={{ fontSize: "0.9rem" }}>
                Forgot password?
              </a>
            </div>

            {requires2FA && (
              <Form.Group className="mb-3">
                <Form.Label>OTP</Form.Label>
                <Form.Control
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                />
              </Form.Group>
            )}
            <Button type="submit" variant="primary">
              Login
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
