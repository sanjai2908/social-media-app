import React, { useState } from "react";
import { Card, Container, Form, Button } from "react-bootstrap";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage("Please enter your registered email address.");
      return;
    }

    // 🔥 DEMO ONLY:
    // Backend connect pannala, so normal explanation message show pannrom.
    setMessage(
      "For this demo, we assume a reset link / OTP has been sent to your email. In a real production app, the backend will generate a secure token and send it via email."
    );
  };

  return (
    <Container style={{ maxWidth: "500px" }} className="mt-4">
      <Card>
        <Card.Body>
          <Card.Title>Forgot Password</Card.Title>
          {message && <div className="mt-2 mb-3">{message}</div>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Enter Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Form.Group>
            <Button type="submit">Send Reset Token (Demo)</Button>
          </Form>

          <hr />
          <p className="mt-3 mb-0" style={{ fontSize: "0.9rem" }}>
            <strong>How it works in real apps:</strong> The system generates a
            secure reset token, stores it in the database, and sends a reset
            link to this email. The user clicks the link, enters a new password,
            and the password gets updated securely.
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ForgotPassword;
