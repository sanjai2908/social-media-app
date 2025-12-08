import React, { useEffect, useState } from "react";
import { Card, Container, Form, Button } from "react-bootstrap";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const HomePosts = () => {
  const { user } = useAuth();

  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [posts, setPosts] = useState([]);

  // for editing
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingCaption, setEditingCaption] = useState("");

  const fetchPosts = async () => {
    try {
      const { data } = await api.get("/posts/feed");
      setPosts(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load posts");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const createPost = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("caption", caption);
    if (image) formData.append("image", image);
    try {
      await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCaption("");
      setImage(null);
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Failed to create post");
    }
  };

  const addComment = async (postId, text) => {
    if (!text) return;
    try {
      await api.post(`/posts/${postId}/comments`, { text });
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Failed to add comment");
    }
  };

  // ---- EDIT POST (caption) ----
  const startEdit = (post) => {
    setEditingPostId(post._id);
    setEditingCaption(post.caption || "");
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditingCaption("");
  };

  const saveEdit = async (postId) => {
    try {
      await api.put(`/posts/${postId}`, { caption: editingCaption });
      setEditingPostId(null);
      setEditingCaption("");
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Failed to update post");
    }
  };

  // ---- DELETE POST ----
  const deletePost = async (postId) => {
    const ok = window.confirm("Are you sure you want to delete this post?");
    if (!ok) return;
    try {
      await api.delete(`/posts/${postId}`);
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete post");
    }
  };

  return (
    <Container style={{ maxWidth: "700px" }}>
      {/* Create post */}
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <Card.Title>Create Post</Card.Title>
          <Form onSubmit={createPost}>
            <Form.Group className="mb-2">
              <Form.Label>Caption</Form.Label>
              <Form.Control
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's on your mind?"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Image (optional)</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
              />
            </Form.Group>
            <Button type="submit">Post</Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Feed posts */}
      {posts.map((p) => {
        const isOwner = user && p.user && p.user._id === user._id;
        const isEditing = editingPostId === p._id;

        return (
          <Card key={p._id} className="mb-3 shadow-sm">
            <Card.Body>
              {/* Header: user + edit/delete */}
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center">
                  {p.user?.profilePic && (
                    <img
                      src={`http://localhost:5000${p.user.profilePic}`}
                      alt="profile"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        marginRight: 8,
                      }}
                    />
                  )}
                  <div>
                    <strong>{p.user?.name}</strong>
                    <div className="text-muted small">
                      {new Date(p.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {isOwner && (
                  <div className="d-flex gap-2">
                    {!isEditing && (
                      <>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => startEdit(p)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => deletePost(p._id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Caption / edit box */}
              {isEditing ? (
                <>
                  <Form.Control
                    className="mb-2"
                    value={editingCaption}
                    onChange={(e) => setEditingCaption(e.target.value)}
                  />
                  <div className="d-flex gap-2 mb-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => saveEdit(p._id)}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="secondary" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <Card.Text>{p.caption}</Card.Text>
              )}

              {/* Image */}
              {p.image && (
                <img
                  src={`http://localhost:5000${p.image}`}
                  alt="post"
                  style={{ maxWidth: "100%", borderRadius: 8 }}
                  className="mb-2"
                />
              )}

              <hr />
              {/* Comments */}
              <h6>Comments</h6>
              {p.comments?.map((c) => (
                <div key={c._id}>
                  <strong>{c.user?.name}: </strong>
                  <span>{c.text}</span>
                </div>
              ))}
              <Form
                className="mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = e.target.elements.comment.value;
                  addComment(p._id, text);
                  e.target.reset();
                }}
              >
                <Form.Control
                  name="comment"
                  placeholder="Add a comment"
                  className="mb-2"
                />
                <Button size="sm" type="submit">
                  Comment
                </Button>
              </Form>
            </Card.Body>
          </Card>
        );
      })}
    </Container>
  );
};

export default HomePosts;
