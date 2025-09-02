const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500,
  },
  commentIDs: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  commentedBy: {
    type: String,
    required: true,
    trim: true,
  },
  commentedDate: {
    type: Date,
    default: Date.now,
  },
  postID: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
  },
  voteCount: {
    type: Number,
    default: 0
  },
  votedBy: [{
    type: String,
    default: []
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

CommentSchema.virtual('url').get(function () {
  return `/comments/${this._id}`;
});

module.exports = mongoose.model('Comment', CommentSchema);
