const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LinkFlairSchema = new Schema({
  content: {
    type: String,
    required: true,
    maxlength: 30,
    trim: true,
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

LinkFlairSchema.virtual('url').get(function () {
  return `/linkFlairs/${this._id}`;
});

module.exports = mongoose.model('LinkFlair', LinkFlairSchema);
