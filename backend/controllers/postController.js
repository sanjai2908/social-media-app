import Post from "../models/postModel.js";

export const createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const imagePath = req.file ? `/uploads/posts/${req.file.filename}` : "";
    const post = await Post.create({
      user: req.user._id,
      caption,
      image: imagePath,
    });
    const populated = await post.populate("user", "name profilePic");
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const followingIds = req.user.following || [];
    const posts = await Post.find({
      user: { $in: [userId, ...followingIds] },
    })
      .populate("user", "name profilePic")
      .populate("comments.user", "name profilePic")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "name profilePic")
      .populate("comments.user", "name profilePic");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate("user", "name profilePic")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = {
      user: req.user._id,
      text: req.body.text,
    };
    post.comments.push(comment);
    await post.save();
    const populated = await post.populate("comments.user", "name profilePic");
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // only owner can edit
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed to edit this post" });
    }

    const { caption } = req.body;
    if (caption !== undefined) {
      post.caption = caption;
    }

    // (image edit panna venumna, later multer logic add pannalam)
    await post.save();
    const updated = await post
      .populate("user", "name profilePic")
      .populate("comments.user", "name profilePic");

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
