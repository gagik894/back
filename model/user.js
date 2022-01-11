const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    maxlength: 255,
    minlength: 2,
    required: true,
  },
  lastname: {
    type: String,
    maxlength: 255,
    minlength: 2,
    required: false,
  },
  avatar: {
    type: String,
    maxlength: 1500,
    minlength: 2,
    required: false,
    default: "1dMQgruv8yU_MVa3f4BX9idns4kZ8aAJQ"
  },
  username: {
    type: String,
    maxlength: 1500,
    minlength: 2,
    required: true,
  },
  email: {
    type: String,
    maxlength: 1500,
    minlength: 0,
    required: false,
  },
  password: {
    type: String,
    maxlength: 1500,
    minlength: 2,
    required: false,
    default: "1dMQgruv8yU_MVa3f4BX9idns4kZ8aAJQ"
  },
  pushToken: {
    type: String,
    maxlength: 1500,
    minlength: 2,
    required: false,
  },
  coverImgUrl: {
    type: String,
    maxlength: 1500,
    minlength: 2,
    required: false,
    default: "1oVbFv9R-B5zFTN4yZLvJf_7mdo2yJzry",
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  info: {
    type: String,
    maxlength: 5000,
    minlength: 2,
    required: false,
  },
  followings: {
    type: Array,
    default: [],
  },
  followers: {
    type: Array,
    default: [],
  },
  likedposts:{
    type: Array,
    default:[],
  },
  dislikedposts:{
    type: Array,
    default:[],
  }
});

module.exports = mongoose.model("User", userSchema);
