const mongoose = require("mongoose");
const Post = require("./models/posts");
const Comment = require("./models/comments");

const DB_URI = "mongodb://localhost:27017/phreddit_test";

beforeAll(async () => {
  await mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  await Post.deleteMany({});
  await Comment.deleteMany({});
});

describe("Post deletion cascade", () => {
  test("should delete all associated comments when a post is deleted", async () => {
    const post = await Post.create({
        title: "Test Post",
        postedBy: "testuser",
        content: "This is a test post",
        communityID: new mongoose.Types.ObjectId(),
    });


    const topLevel = await Comment.create({
      content: "Top-level",
      commentedBy: "testuser",
      postID: post._id,
      parentType: "post",
      parentID: post._id,
    });

    const reply = await Comment.create({
      content: "Reply",
      commentedBy: "testuser",
      postID: post._id,
      parentType: "comment",
      parentID: topLevel._id,
    });

    topLevel.commentIDs.push(reply._id);
    await topLevel.save();

    post.commentIDs.push(topLevel._id);
    await post.save();

    await Comment.deleteMany({ postID: post._id });
    await Post.findByIdAndDelete(post._id);

    const foundPost = await Post.findById(post._id);
    const foundTop = await Comment.findById(topLevel._id);
    const foundReply = await Comment.findById(reply._id);

    expect(foundPost).toBeNull();
    expect(foundTop).toBeNull();
    expect(foundReply).toBeNull();
  });
});
