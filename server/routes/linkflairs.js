const express = require('express');
const router = express.Router();
const LinkFlair = require('../models/linkflairs');
const Post = require('../models/posts');
const Community = require('../models/communities');


router.get('/', async (req, res) => {
  try {
    const flairs = await LinkFlair.find();
    res.json(flairs);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { content, communityID } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Flair content is required' });
    }

    const flair = new LinkFlair({ content: content.trim() });
    await flair.save();

    if (communityID) {
      await Community.findByIdAndUpdate(communityID, { $addToSet: { linkFlairs: flair._id } });
    }

    res.status(201).json(flair);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create flair', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const flairID = req.params.id;
    const inUse = await Post.exists({ linkFlairID: flairID });
    if (inUse) {
      return res.status(400).json({ message: 'Cannot delete flair in use by a post' });
    }

    await LinkFlair.findByIdAndDelete(flairID);
    await Community.updateMany({}, { $pull: { linkFlairs: flairID } });

    res.json({ message: 'Flair deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete flair', error: err.message });
  }
});

module.exports = router;
