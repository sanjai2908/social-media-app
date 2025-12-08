import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Profile from "./components/Profile";
import SearchUsers from "./components/SearchUsers";
import FollowersFollowing from "./components/FollowersFollowing";
import HomePosts from "./components/HomePosts";
import ChatList from "./components/ChatList";
import ChatScreen from "./components/ChatScreen";
import ForgotPassword from "./components/ForgotPassword"; // 🔥 new
import { useAuth } from "./context/AuthContext";
import { Container, Row, Col, Card } from "react-bootstrap";

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = React.useState(null);
  return (
    <Container className="mt-3">
      <Row>
        <Col md={4}>
          <Card>
            <Card.Header>Chats</Card.Header>
            <Card.Body style={{ maxHeight: "400px", overflowY: "auto" }}>
              <ChatList onSelectChat={setSelectedChat} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <ChatScreen selectedChat={selectedChat} />
        </Col>
      </Row>
    </Container>
  );
};

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <HomePosts />
            </PrivateRoute>
          }
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* 🔥 Forgot Password (no login needed) */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/search"
          element={
            <PrivateRoute>
              <SearchUsers />
            </PrivateRoute>
          }
        />
        <Route
          path="/followers"
          element={
            <PrivateRoute>
              <FollowersFollowing />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
