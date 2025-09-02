const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Community = require('../models/communities');
const Post = require('../models/posts');
const Comment = require('../models/comments');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { firstName, lastName, email, displayName, password, password2 } = req.body;

  if (!firstName || !lastName || !email || !displayName || !password || !password2) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  if (password !== password2) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  const lowered = password.toLowerCase();
  if (
    lowered.includes(firstName.toLowerCase()) ||
    lowered.includes(lastName.toLowerCase()) ||
    lowered.includes(displayName.toLowerCase()) ||
    lowered.includes(email.toLowerCase())
  ) {
    return res.status(400).json({ message: 'Password must not include personal info' });
  }

  try {
    const [emailTaken, displayTaken] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ displayName }),
    ]);

    const conflictMessages = [];
    if (emailTaken) conflictMessages.push("Email is already registered");
    if (displayTaken) conflictMessages.push("Display name is already taken");

    if (conflictMessages.length > 0) {
      return res.status(400).json({ message: conflictMessages.join(" | ") });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      displayName,
      password: hashedPassword,
      reputation: 100,
    });

    await newUser.save();
    res.status(201).json({
      _id: newUser._id,
      displayName: newUser.displayName,
      email: newUser.email,
      reputation: newUser.reputation,
      isAdmin: newUser.isAdmin,
      joinedCommunityIDs: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const joinedCommunities = await Community.find({
    members: user.displayName,
  }).select('_id');

  const joinedCommunityIDs = joinedCommunities.map(c => c._id.toString());

  res.status(200).json({
    _id: user._id,
    displayName: user.displayName,
    email: user.email,
    reputation: user.reputation,
    isAdmin: user.isAdmin,
    joinedCommunityIDs,
  });
});

router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('displayName email reputation createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("displayName email reputation _id");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userID = req.params.id;
    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ message: "User not found" });

    const displayName = user.displayName;

    
    const userCommunities = await Community.find({ createdBy: displayName });
    for (const community of userCommunities) {
      const posts = await Post.find({ communityID: community._id });
      for (const post of posts) {
        await Comment.deleteMany({ postID: post._id });
        await Post.findByIdAndDelete(post._id);
      }
      await Community.findByIdAndDelete(community._id);
    }

   
    const userPosts = await Post.find({ postedBy: displayName });
    for (const post of userPosts) {
      await Comment.deleteMany({ postID: post._id });
      await Post.findByIdAndDelete(post._id);
    }

    const userComments = await Comment.find({ commentedBy: displayName });
    const toDelete = new Set(userComments.map(c => c._id.toString()));

    let added;
    do {
      added = false;
      const replies = await Comment.find({ parentID: { $in: [...toDelete] } });
      for (const reply of replies) {
        if (!toDelete.has(reply._id.toString())) {
          toDelete.add(reply._id.toString());
          added = true;
        }
      }
    } while (added);

    await Comment.deleteMany({ _id: { $in: [...toDelete] } });

    const votedPosts = await Post.find({ votedBy: displayName });
    for (const post of votedPosts) {
      post.voteCount = Math.max(0, post.voteCount - 1); 
      post.votedBy = post.votedBy.filter(v => v !== displayName);
      await post.save();
    }

    const votedComments = await Comment.find({ votedBy: displayName });
    for (const comment of votedComments) {
      comment.voteCount = Math.max(0, comment.voteCount - 1);
      comment.votedBy = comment.votedBy.filter(v => v !== displayName);
      await comment.save();
    }


    await Community.updateMany(
      { members: displayName },
      { $pull: { members: displayName } }
    );


    await User.findByIdAndDelete(userID);


    res.status(200).json({ message: "User and all associated content deleted successfully." });
  } catch (err) {
    console.error("Failed to delete user:", err);
    res.status(500).json({ message: "Server error during deletion", error: err.message });
  }
});

module.exports = router;
