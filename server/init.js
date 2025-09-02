/* server/init.js
** You must write a script that will create documents in your database according
** to the datamodel you have defined for the application.  Remember that you 
** must at least initialize an admin user account whose credentials are derived
** from command-line arguments passed to this script. But, you should also add
** some communities, posts, comments, and link-flairs to fill your application
** some initial content.  You can use the initializeDB.js script from PA03 as 
** inspiration, but you cannot just copy and paste it--you script has to do more
** to handle the addition of users to the data model.
*/
// server/init.js
// Usage: node init.js <mongo_url> <admin_email> <admin_display_name> <admin_password>

const mongoose = require("mongoose");
const bcrypt   = require("bcrypt");

const CommunityModel = require("./models/communities");
const PostModel      = require("./models/posts");
const CommentModel   = require("./models/comments");
const LinkFlairModel = require("./models/linkflairs");
const UserModel      = require("./models/User");


console.log("🔄 Running init.js");


const [mongoURL, adminEmail, adminDisplayName, adminPassword] = process.argv.slice(2);
if (!mongoURL || !adminEmail || !adminDisplayName || !adminPassword) {
  console.error("Usage: node init.js <mongo_url> <admin_email> <admin_display_name> <admin_password>");
  process.exit(1);
}


mongoose.connect(mongoURL);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));


async function clearDatabase() {
  await UserModel.deleteMany({});
  await CommunityModel.deleteMany({});
  await PostModel.deleteMany({});
  await CommentModel.deleteMany({});
  await LinkFlairModel.deleteMany({});
}

async function createAdmin() {
  const existing = await UserModel.findOne({ email: adminEmail });
  if (existing) {
    console.log("⚠️ Admin already exists. Skipping admin creation.");
    return existing;
  }

  const hash = await bcrypt.hash(adminPassword, 10);
  return new UserModel({
    email: adminEmail,
    displayName: adminDisplayName,
    password: hash,
    reputation: 1000,
    isAdmin: true
  }).save();
}

function createLinkFlair(content) {
  return new LinkFlairModel({ content }).save();
}


function createComment({ content, commentedBy, commentedDate, replies = [] }) {
  return new CommentModel({ content, commentedBy, commentedDate, commentIDs: replies }).save();
}


function createCommunity({ name, description, startDate, members, createdBy }) {
  return new CommunityModel({ name, description, startDate, members, postIDs: [], createdBy }).save();
}


function createPost({ title, content, postedBy, postedDate, views, linkFlairID, commentIDs = [], communityID }) {
  return new PostModel({ title, content, postedBy, postedDate, views, linkFlairID, commentIDs, communityID }).save();
}

async function initializeDB() {
  await clearDatabase();


  const admin = await createAdmin();

  const [lf1, lf2, lf3, lf4] = await Promise.all([
    createLinkFlair("The jerkstore called..."),
    createLinkFlair("Literal Saint"),
    createLinkFlair("They walk among us"),
    createLinkFlair("Worse than Hitler"),
  ]);


  const comments = await Promise.all([
    createComment({ content: "God bless Elon. NTJ.", commentedBy: "shemp", commentedDate: new Date("2024-08-23T08:22:00Z") }),
    createComment({ content: "Obvious rage bait. YTJ.", commentedBy: "astyanax", commentedDate: new Date("2024-08-23T10:57:00Z") }),
    createComment({ content: "My brother in Christ, are you ok? YTJ.", commentedBy: "rollo", commentedDate: new Date("2024-08-23T09:31:00Z") }),
    createComment({ content: "The truth is out there.", commentedBy: "astyanax", commentedDate: new Date("2024-09-10T06:41:00Z") }),
    createComment({ content: "The same thing happened to me.", commentedBy: "bigfeet", commentedDate: new Date("2024-09-09T17:03:00Z") }),
    createComment({ content: "I want to believe.", commentedBy: "outtheretruth47", commentedDate: new Date("2024-09-10T07:18:00Z") }),
    createComment({ content: "Generic poster slogan #42", commentedBy: "bigfeet", commentedDate: new Date("2024-09-10T09:43:00Z") }),
  ]);

  const jerkComm = await createCommunity({
    name: "Am I the Jerk?",
    description: "A practical application of justice.",
    startDate: new Date("2014-08-10T04:18:00Z"),
    members: ["rollo", "shemp", "catlady13", "astyanax", "trucknutz69"],
    createdBy: "trucknutz69",
  });
  const histComm = await createCommunity({
    name: "The History Channel",
    description: "A fantastical reimagining of history.",
    startDate: new Date("2017-05-04T08:32:00Z"),
    members: ["MarcoArelius", "astyanax", "outtheretruth47", "bigfeet"],
    createdBy: "MarcoArelius",
  });

  const [p1, p2] = await Promise.all([
    createPost({
      title: "AITJ: I parked my cybertruck in the handicapped spot",
      content: "Went to the store... was I the jerk?",
      postedBy: "trucknutz69",
      postedDate: new Date("2024-08-23T01:19:00Z"),
      views: 14,
      linkFlairID: lf1._id,
      commentIDs: [comments[0]._id, comments[1]._id],
      communityID: jerkComm._id,
    }),
    createPost({
      title: "Remember when this was a HISTORY channel?",
      content: "Aliens, cryptids, etc... anyone else?",
      postedBy: "MarcoArelius",
      postedDate: new Date("2024-09-09T14:24:00Z"),
      views: 1023,
      linkFlairID: lf3._id,
      commentIDs: [comments[3]._id, comments[4]._id],
      communityID: histComm._id,
    }),
  ]);

  jerkComm.postIDs.push(p1._id);
  histComm.postIDs.push(p2._id);
  await jerkComm.save();
  await histComm.save();

  console.log("✅ Database initialized.");
  db.close();
}

initializeDB().catch((err) => {
  console.error("ERROR:", err);
  db.close();
});