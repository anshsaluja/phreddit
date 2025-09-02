const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const flairRoutes = require('./routes/linkflairs');
const communityRoutes = require('./routes/communities');
const userRoutes = require('./routes/users');

const app = express();
const PORT = 8000;
const MONGO_URL = 'mongodb://127.0.0.1:27017/phreddit';

app.use(cors());
app.use(express.json());

mongoose.connect(MONGO_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const db = mongoose.connection;

app.get("/", (req, res) => {
  res.send("Hello Phreddit!");
});

app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/flairs', flairRoutes);
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

process.on('SIGINT', async () => {
  await db.close();
  console.log('Server closed. Database instance disconnected.');
  process.exit(0);
});
