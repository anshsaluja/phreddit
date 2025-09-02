const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Comment = require("../models/comments");
const Post = require("../models/posts");
const User = require("../models/User");


router.get("/", async (req, res) => {
  try {
    const comments = await Comment.find().populate("commentIDs");
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { content, commentedBy, parentType, parentID } = req.body;

    if (!content?.trim() || !commentedBy?.trim() || !parentType || !parentID) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(parentID)) {
      return res.status(400).json({ message: "Invalid parentID format" });
    }

    const newComment = new Comment({
      content: content.trim(),
      commentedBy: commentedBy.trim(),
      commentIDs: [],
      commentedDate: new Date(),
      postID: null,
    });

    if (parentType === "post") {
      const post = await Post.findById(parentID);
      if (!post) return res.status(404).json({ message: "Parent post not found" });

      post.commentIDs.push(newComment._id);
      newComment.postID = post._id;
      await Promise.all([post.save(), newComment.save()]);

    } else if (parentType === "comment") {
      const parentComment = await Comment.findById(parentID);
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }

      parentComment.commentIDs.push(newComment._id);
      await parentComment.save();

      if (parentComment.postID) {
        newComment.postID = parentComment.postID;
      } else {
        const fallbackPost = await Post.findOne({ commentIDs: parentComment._id });
        if (fallbackPost) {
          newComment.postID = fallbackPost._id;
        }
      }

      await newComment.save();
    } else {
      return res.status(400).json({ message: 'Invalid parentType. Must be "post" or "comment"' });
    }

    const savedComment = await Comment.findById(newComment._id).lean();
    res.status(201).json(savedComment);

  } catch (err) {
    res.status(500).json({ message: "Failed to create comment", error: err.message });
  }
});

router.patch("/:id/vote", async (req, res) => {
  const rawDisplayName = req.body.voterDisplayName;
  const voteType = req.body.voteType;

  if (!["up", "down"].includes(voteType)) {
    return res.status(400).json({ message: "Invalid vote type" });
  }

  const cleanDisplayName = rawDisplayName?.trim();
  if (!cleanDisplayName) {
    return res.status(400).json({ message: "Invalid voter display name" });
  }

  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const voter = await User.findOne({
      displayName: new RegExp(`^${cleanDisplayName}$`, "i"),
    });
    if (!voter) return res.status(404).json({ message: `User '${cleanDisplayName}' not found` });

    if (voter.reputation < 50) {
      return res.status(403).json({ message: "Insufficient reputation to vote" });
    }

    if (comment.votedBy.includes(cleanDisplayName)) {
      return res.status(400).json({ message: "You’ve already voted on this comment" });
    }

    const delta = voteType === "up" ? 1 : -1;
    const repChange = voteType === "up" ? 5 : -10;

    comment.voteCount += delta;
    comment.votedBy.push(cleanDisplayName);
    await comment.save();

    const commenter = await User.findOne({
      displayName: new RegExp(`^${comment.commentedBy.trim()}$`, "i"),
    });
    if (commenter) {
      commenter.reputation += repChange;
      await commenter.save();
    }

    res.json({ message: "Vote recorded", voteCount: comment.voteCount });

  } catch (err) {
    res.status(500).json({ message: "Voting failed", error: err.message });
  }
});

router.get("/user/:displayName", async (req, res) => {
  try {
    const comments = await Comment.find({ commentedBy: req.params.displayName })
      .select("content commentedDate postID")
      .populate("postID", "title")
      .lean();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch comments", error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const updated = await Comment.findByIdAndUpdate(
      req.params.id,
      { content: content.trim() },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Comment not found" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update comment", error: err.message });
  }
});

const deleteCommentAndReplies = async (commentId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) return;

  for (const replyId of comment.commentIDs) {
    await deleteCommentAndReplies(replyId);
  }

  await Comment.findByIdAndDelete(commentId);
};

router.delete("/:id", async (req, res) => {
  try {
    await deleteCommentAndReplies(req.params.id);
    res.json({ message: "Comment and all replies deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete comment", error: err.message });
  }
});

module.exports = router;
