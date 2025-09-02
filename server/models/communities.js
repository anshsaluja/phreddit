const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommunitySchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100,
    unique: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  createdBy: {
    type: String,
    required: true,
    index: true,
  },
  postIDs: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  linkFlairs: [{ type: Schema.Types.ObjectId, ref: 'LinkFlair' }], 
  startDate: {
    type: Date,
    default: Date.now,
  },
  members: {
    type: [String],
    validate: [arr => arr.length > 0, 'Community must have at least 1 member'],
  },
  voteCount: {
    type: Number,
    default: 0,
  },
  votedBy: [{
    type: String,
  }]
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

CommunitySchema.virtual('url').get(function () {
  return `/communities/${this._id}`;
});

CommunitySchema.virtual('memberCount').get(function () {
  return Array.isArray(this.members) ? this.members.length : 0;
});

module.exports = mongoose.model('Community', CommunitySchema);
