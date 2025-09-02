const express = require("express");
const router = express.Router();
const Community = require("../models/communities");
const Post = require("../models/posts");
const Comment = require("../models/comments");
const LinkFlair = require("../models/linkflairs"); 


router.post("/", async (req, res) => {
  try {
    const { name, description, members, createdBy } = req.body;

    if (!name?.trim() || !description?.trim() || !Array.isArray(members) || members.length === 0 || !createdBy?.trim()) {
      return res.status(400).json({ message: "Missing or invalid required fields" });
    }

    const normalized = name.trim().toLowerCase();

    const existing = await Community.findOne({ name: normalized });
    if (existing) {
      return res.status(409).json({ message: "Community with that name already exists" });
    }

    const community = new Community({
      name: normalized,
      description: description.trim(),
      members: members.map((m) => m.trim()),
      createdBy: createdBy.trim(),
    });

    await community.save();
    res.status(201).json(community);
  } catch (err) {
    res.status(500).json({ message: "Failed to create community", error: err.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const communities = await Community.find();
    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});


router.patch("/:id/join", async (req, res) => {
  try {
    const displayName = req.body.displayName?.trim();
    if (!displayName) return res.status(400).json({ message: "Missing displayName" });

    const community = await Community.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: displayName } },
      { new: true }
    );

    if (!community) return res.status(404).json({ message: "Community not found" });

    res.json(community);
  } catch (err) {
    res.status(500).json({ message: "Failed to join community", error: err.message });
  }
});


router.patch("/:id/leave", async (req, res) => {
  try {
    const displayName = req.body.displayName?.trim();
    if (!displayName) return res.status(400).json({ message: "Missing displayName" });

    const community = await Community.findByIdAndUpdate(
      req.params.id,
      { $pull: { members: displayName } },
      { new: true }
    );

    if (!community) return res.status(404).json({ message: "Community not found" });

    res.json(community);
  } catch (err) {
    res.status(500).json({ message: "Failed to leave community", error: err.message });
  }
});

router.get("/user/:displayName", async (req, res) => {
  try {
    const posts = await Post.find({ postedBy: req.params.displayName })
      .select("title postedDate communityID voteCount")
      .populate("communityID", "name") 
      .lean();


    const validPosts = posts.filter(p => p.communityID);

    res.json(validPosts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
});

// Update a community
router.patch("/:id", async (req, res) => {
  try {
    const { name, description } = req.body;
    const update = {};
    if (name) update.name = name.trim().toLowerCase();
    if (description) update.description = description.trim();

    const community = await Community.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!community) return res.status(404).json({ message: "Community not found" });

    res.json(community);
  } catch (err) {
    res.status(500).json({ message: "Failed to update community", error: err.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const community = await Community.findByIdAndDelete(req.params.id);
    if (!community) return res.status(404).json({ message: "Community not found" });

    const posts = await Post.find({ communityID: community._id });
    const postIDs = posts.map(p => p._id);
    const flairIDs = posts.map(p => p.linkFlairID).filter(Boolean);

    await Post.deleteMany({ _id: { $in: postIDs } });
    await Comment.deleteMany({ postID: { $in: postIDs } });

  
    for (const flairID of flairIDs) {
      const stillUsed = await Post.exists({ linkFlairID: flairID });
      if (!stillUsed) {
        await LinkFlair.findByIdAndDelete(flairID);
      }
    }

    res.json({ message: "Community and all associated posts/comments/flairs deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete community", error: err.message });
  }
});

router.get("/creator/:displayName", async (req, res) => {
  try {
    const displayName = req.params.displayName?.trim();
    if (!displayName) {
      return res.status(400).json({ message: "Missing or invalid displayName" });
    }

    const communities = await Community.find({ createdBy: displayName }).select("name description startDate");
    res.json(communities);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch communities", error: err.message });
  }
});

module.exports = router;
