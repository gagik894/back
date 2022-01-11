const express = require("express");
const Message = require("../model/message");
const User = require("../model/user");
const check = require("./checkToken");
const router = express.Router();

router.post("/add", check, async (req, res) => {
  const profileData = { ...req.body };
  profileData.userId = req.user;
  const chats = await Message.find();
  const date = new Date();
  try {
    let n = 0;
    if (chats.length != 0) {
      for (let i = 0; i < chats.length; i++) {
        if (
          (chats[i].userId == profileData.userId &&
            chats[i].userId1 == profileData.userId1) ||
          (chats[i].userId1 == profileData.userId &&
            chats[i].userId == profileData.userId1)
        ) {
          const id = chats[i]._id;

          const messageData = await Message.findByIdAndUpdate(id, {
            $push: {
              chat: {
                message: profileData.message,
                user: profileData.userId,
                time: date,
                user1: profileData.userId1,
              },
            },
          });
          const message = await Message.findById(messageData.id);
          res.send(message);
          break;
        } else {
          n++;
        }
      }

      if (n == chats.length) {
        const message = new Message(profileData);
        const data = await message.save();
        const messageData = await Message.findByIdAndUpdate(data.id, {
          $push: {
            chat: {
              message: profileData.message,
              user: profileData.userId,
              time: date,
              user1: profileData.userId1,
            },
          },
        });
        const send = await Message.findById(messageData.id);
        res.send(send);
      }
    } else {
      const message = new Message(profileData);
      const data = await message.save();
      const messageData = await Message.findByIdAndUpdate(data.id, {
        $push: {
          chat: {
            message: profileData.message,
            user: profileData.userId,
            time: date,
            user1: profileData.userId1,
          },
        },
      });
      const send = await Message.findById(messageData.id);
      res.send(send);
    }
  } catch (error) {
    res.status(400).send({ error: "!Something went wrong!" });
  }
});
router.get("/users", async (req, res) =>{
  try {
    const users = await User.find()
    console.log(users);
    res.send(users)
  } catch (error) {
    console.log(error)
    res.status(400).send({ error: "Something went wrong" });
  }
})
router.get("/", check, async (req, res) => {
  try {
  const userId = req.user;
  const messageData = await Message.find()
    .populate("userId1", "fullname username email avatar _id")
    .populate("userId", "fullname username email avatar _id");
    
  const array = [];
  for (let i = 0; i < messageData.length; i++) {
    if (
      messageData[i].userId._id == userId ||
      messageData[i].userId1._id == userId
    ) {
      array.push(messageData[i]);
    }
  }

  const data = {
    messageData: array,
    user: userId,
  };
    res.send(data);
  } catch (error) {
    console.log(error)
    res.status(400).send({ error: "Something went wrong" });
  }
});
module.exports = router;
