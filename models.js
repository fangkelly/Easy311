const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  comments: {
    type: Array,
    required: true,
  },
});

const Comment = mongoose.model("Comment", CommentSchema);

module.exports = Comment;