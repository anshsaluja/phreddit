const express   = require("express");
const router    = express.Router();
const Post      = require("../models/posts");
const Community = require("../models/communities");
const User      = require("../models/User");
const Comment   = require("../models/comments");
const LinkFlair = require("../models/linkflairs");


router.get("/", async (req, res) => {
  try {
    const posts = await Post.find({})
      .select("title content postedDate views communityID linkFlairID commentIDs postedBy voteCount votedBy")
      .populate("linkFlairID")
      .populate("commentIDs")
      .populate("communityID", "_id name")
      .lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/", async (req, res) => {
  try {
    const { title, content, linkFlairID, linkFlairText, postedBy, communityID } = req.body;
    if (!title || !content || !postedBy || !communityID) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let flairIDToUse = null;
    if (linkFlairText?.trim()) {
      const flair = new LinkFlair({ content: linkFlairText.trim() });
      await flair.save();
      flairIDToUse = flair._id;
      await Community.findByIdAndUpdate(communityID, { $addToSet: { linkFlairs: flair._id } });
    } else if (linkFlairID) {
      flairIDToUse = linkFlairID;
    }

    const newPost = new Post({ title, content, postedBy, communityID, linkFlairID: flairIDToUse });
    await newPost.save();
    await Community.findByIdAndUpdate(communityID, { $push: { postIDs: newPost._id } });

    const populated = await Post.findById(newPost._id)
      .select("title content postedDate views communityID linkFlairID commentIDs postedBy")
      .populate("linkFlairID")
      .populate("communityID", "_id name")
      .lean();

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to create post", error: err.message });
  }
});


router.patch("/:id/view", async (req, res) => {
  try {
    const updated = await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
    if (!updated) return res.status(404).json({ message: "Post not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating view count", error: err.message });
  }
});


router.patch("/:id/vote", async (req, res) => {
  try {
    const { voteType, voterDisplayName } = req.body;
    if (!voteType || !["up", "down"].includes(voteType) || !voterDisplayName) {
      return res.status(400).json({ message: "Invalid vote data" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const voter = await User.findOne({ displayName: voterDisplayName.trim() });
    if (!voter) return res.status(404).json({ message: "Voter not found" });
    if (voter.reputation < 50) return res.status(403).json({ message: "Insufficient reputation to vote" });
    if (post.votedBy.includes(voterDisplayName.trim())) {
      return res.status(400).json({ message: "You have already voted on this post" });
    }

    post.voteCount += voteType === "up" ? 1 : -1;
    post.votedBy.push(voterDisplayName.trim());
    await post.save();

    const author = await User.findOne({ displayName: post.postedBy.trim() });
    if (author) {
      author.reputation += voteType === "up" ? 5 : -10;
      await author.save();
    }

    res.json({ voteCount: post.voteCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to vote", error: err.message });
  }
});

router.get("/user/:displayName", async (req, res) => {
  try {
    const posts = await Post.find({ postedBy: req.params.displayName })
      .select("title postedDate communityID voteCount")
      .populate("communityID", "name")
      .lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const flairID = post.linkFlairID;
    const communityID = post.communityID;

    await post.deleteOne();
    await Community.findByIdAndUpdate(communityID, { $pull: { postIDs: post._id } });
    await Comment.deleteMany({ postID: post._id });

    if (flairID) {
      const stillUsed = await Post.exists({ communityID, linkFlairID: flairID });
      if (!stillUsed) {
        await Community.findByIdAndUpdate(communityID, { $pull: { linkFlairs: { _id: flairID } } });
        await LinkFlair.findByIdAndDelete(flairID);
      }
    }

    res.json({ message: "Post and associated comments deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete post", error: err.message });
  }
});


router.patch("/:id", async (req, res) => {
  try {
    const { title, content, linkFlairID, linkFlairText, communityID } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const originalFlairID = post.linkFlairID;
    const originalCommunityID = post.communityID?.toString();

    post.title = title.trim();
    post.content = content.trim();

    let newFlairID = linkFlairID || null;
    if (linkFlairText?.trim()) {
      const flair = new LinkFlair({ content: linkFlairText.trim() });
      await flair.save();
      newFlairID = flair._id;
      await Community.findByIdAndUpdate(communityID, { $addToSet: { linkFlairs: newFlairID } });
    }

    post.linkFlairID = newFlairID;

    if (communityID && communityID !== originalCommunityID) {
      post.communityID = communityID;
      await Community.findByIdAndUpdate(originalCommunityID, { $pull: { postIDs: post._id } });
      await Community.findByIdAndUpdate(communityID, { $addToSet: { postIDs: post._id } });
    }

    await post.save();

    if (
      originalFlairID &&
      (newFlairID?.toString() !== originalFlairID?.toString() || communityID !== originalCommunityID)
    ) {
      const stillUsed = await Post.exists({
        communityID: originalCommunityID,
        linkFlairID: originalFlairID
      });
      if (!stillUsed) {
        await Community.findByIdAndUpdate(originalCommunityID, {
          $pull: { linkFlairs: { _id: originalFlairID } }
        });
        await LinkFlair.findByIdAndDelete(originalFlairID);
      }
    }

    const populated = await Post.findById(post._id)
      .select("title content postedDate views communityID linkFlairID commentIDs postedBy")
      .populate("linkFlairID")
      .populate("communityID", "_id name")
      .lean();

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update post", error: err.message });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .select("title content postedDate views communityID linkFlairID commentIDs postedBy voteCount votedBy")
      .populate("linkFlairID")
      .populate("commentIDs")
      .populate("communityID", "_id name")
      .lean();

    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch post", error: err.message });
  }
});

module.exports = router;
