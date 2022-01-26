const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    maxlength: 255,
    minlength: 2,
    required: false,
  },
  imgId: {
    type: String,
    maxlength: 1500,
    minlength: 2,
    required: false,
  },
  desc: {
    type: String,
    maxlength: 5000,
    minlength: 2,
    required: false,
  },
  text: {
    type: String,
    require: false,
  },
  coverImgUrl: {
    type: String,
    maxlength: 1500,
    minlength: 2,
    required: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  likes: {
    type: Number,
    default: 0,
  },
  dislikes: {
    type: Number,
    default: 0,
  },
  likedpeople: {
    type: Array,
    default: [],
  },
  dislikedpeople: {
    type: Array,
    default: [],
  },
  type: {
    type: String,
    default: "image",
  }
});

module.exports = mongoose.model("Post", postSchema);
