import React, { useState, useEffect } from "react";
import { Card, Container, Form, Button, Image } from "react-bootstrap";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [qr, setQr] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [myPosts, setMyPosts] = useState([]);

  const [isEditing, setIsEditing] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/users/me");
      setProfile(data);
      setName(data.name || "");
      setBio(data.bio || "");

      const postsRes = await api.get(`/posts/user/${data._id}`);
      // optional: newest first
      const posts = [...postsRes.data].reverse();
      setMyPosts(posts);
    } catch (err) {
      console.error(err);
      setError("Failed to load profile");
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put("/users/me", { name, bio });
      setProfile(data);
      setMessage("Profile updated");
      setError("");
      setIsEditing(false);
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const cancelEdit = () => {
    setName(profile.name || "");
    setBio(profile.bio || "");
    setIsEditing(false);
  };

  const handleFileChange = async (e) => {
    if (!isEditing) return;
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { data } = await api.post("/users/me/profile-pic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((prev) => ({ ...prev, profilePic: data.profilePic }));
      setError("");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to upload profile picture"
      );
    }
  };

  const generate2FA = async () => {
    try {
      const { data } = await api.post("/auth/2fa/generate");
      setQr(data.qrDataUrl);
      setOtp("");
      setError("");
      setMessage("QR generated. Scan it in Google Authenticator.");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to generate QR code");
    }
  };

  const enable2FA = async () => {
    if (!otp.trim()) {
      setError("Please enter OTP from Authenticator app");
      return;
    }

    try {
      // ❗ If your backend expects another field name (e.g. { token }),
      // change "otp" here to match that.
      const { data } = await api.post("/auth/2fa/enable", { otp });

      setMessage(data.message || "Two Factor Authentication enabled");
      setError("");
      setOtp("");
      setQr("");
      fetchProfile();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to enable 2FA. Check OTP."
      );
    }
  };

  if (!profile) return <Container>Loading...</Container>;

  return (
    <Container style={{ maxWidth: "700px" }} className="mt-3 mb-4">
      <Card className="mb-3">
        <Card.Body>
          <Card.Title className="mb-3">Profile</Card.Title>
          {message && <div className="text-success mb-2">{message}</div>}
          {error && <div className="text-danger mb-2">{error}</div>}

          <div className="mb-2">
            <strong>{profile.name}</strong>
            <div>
              Followers: {profile.followers ? profile.followers.length : 0}{" "}
              &nbsp;&nbsp; Following:{" "}
              {profile.following ? profile.following.length : 0}
            </div>
          </div>

          {/* Profile picture */}
          <div className="mb-3 d-flex align-items-center gap-3">
            {profile.profilePic && (
              <Image
                src={`http://localhost:5000${profile.profilePic}`}
                roundedCircle
                width={80}
                height={80}
              />
            )}
            {isEditing && (
              <Form.Group>
                <Form.Label>Profile Picture</Form.Label>
                <Form.Control type="file" onChange={handleFileChange} />
              </Form.Group>
            )}
          </div>

          {/* View mode vs Edit mode */}
          {!isEditing ? (
            <>
              <p className="mb-1">
                <strong>Name:</strong> {profile.name}
              </p>
              <p className="mb-1">
                <strong>Email:</strong> {profile.email}
              </p>
              <p className="mb-3">
                <strong>Bio:</strong>{" "}
                {profile.bio && profile.bio.trim()
                  ? profile.bio
                  : "No bio added yet."}
              </p>
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            </>
          ) : (
            <Form onSubmit={updateProfile}>
              <Form.Group className="mb-2">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Bio</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </Form.Group>
              <div className="d-flex gap-2">
                <Button type="submit">Save</Button>
                <Button variant="secondary" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>

      {/* My Posts */}
      <Card className="mb-3">
        <Card.Body>
          <Card.Title>My Posts</Card.Title>
          {myPosts.length === 0 && <p>No posts yet.</p>}
          <div className="d-flex flex-wrap gap-3 mt-2">
            {myPosts.map((p) => (
              <div key={p._id} style={{ width: "170px" }}>
                {p.image ? (
                  <>
                    <img
                      src={`http://localhost:5000${p.image}`}
                      alt="post"
                      style={{
                        width: "100%",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                    {p.caption && (
                      <div
                        className="mt-1 text-truncate"
                        title={p.caption}
                        style={{ fontSize: "0.85rem" }}
                      >
                        {p.caption}
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "150px",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 4,
                      fontSize: "0.85rem",
                      textAlign: "center",
                    }}
                  >
                    {p.caption || "No caption"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* 2FA section (bottom) */}
      <Card>
        <Card.Body>
          <Card.Title>Two Factor Authentication</Card.Title>
          <p>Enabled: {profile.twoFactorEnabled ? "Yes" : "No"}</p>
          {!profile.twoFactorEnabled && (
            <>
              <Button onClick={generate2FA} className="mb-3">
                Generate QR
              </Button>
              {qr && (
                <div className="mb-3">
                  <p>Scan this QR in Google Authenticator:</p>
                  <img src={qr} alt="2FA QR" style={{ maxWidth: "200px" }} />
                  <Form.Label className="mt-2">Enter OTP</Form.Label>
                  <Form.Control
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <Button onClick={enable2FA} className="mt-2">
                    Enable 2FA
                  </Button>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Profile;
