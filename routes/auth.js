const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const check = require("./checkToken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const router = express.Router();
const Post = require("../model/post");
const Message = require("../model/message");

router.post("/signin", async (req, res) => {
  console.log(req.body);
  try {
    const emailExists = await User.findOne({
      email: req.body.email.toLowerCase(),
    });
    if (!emailExists) {
      res
        .status(400)
        .send({ error: "Please register, this email doesn't exist" });
      return;
    }
    const samePassword = await bcrypt.compare(
      req.body.password,
      emailExists.password
    );
    if (!samePassword) {
      res.status(400).send({
        error: "Incorrect password for" + " " + req.body.email.toLowerCase(),
      });
      return;
    }
    const newPushToken = await User.findOneAndUpdate(
      { email: req.body.email.toLowerCase() },
      { pushToken: req.body.pushToken }
    );
    const token = jwt.sign({ id: emailExists._id }, "tumo_students");
    res.send({ auth_token: token });
  } catch (error) {
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const data = { ...req.body };
    const profileData = JSON.parse(data.profileData);
    const sameCode = await bcrypt.compare(data.code, data.codeHash);
    console.log(data);
    if (sameCode) {
      const user = new User(profileData);
      const data = await user.save();
      const users = await User.find();
      for (let i = 0; i < users.length - 1; i++) {
        const messagesData = { userId: data._id, userId1: users[i]._id };
        const message = new Message(messagesData);
        const dataM = await message.save();
      }
      const newPushToken = await User.findOneAndUpdate(
        { email: profileData.email.toLowerCase() },
        { pushToken: profileData.pushToken }
      );
      const token = jwt.sign({ id: data._id }, "tumo_students");
      console.log(token);
      res.send({ auth_token: token });
    } else {
      res.status(400).send({ error: "Wrong security code" });
    }
  } catch (error) {
    res.status(400).send({ error: "Something went wrong" });
    console.log(error);
  }
});
router.get("/signout", check, async (req, res) => {
  try {
    console.log("test");
    const newPushToken = await User.findOneAndUpdate(
      { _id: req.user },
      { pushToken: null }
    );
    res.send({ user: req.user });
  } catch (error) {
    res.status(400).send({ error: "Something went wrong" });
    console.log(error);
  }
});

router.post("/search", check, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.search.length == 0) {
      res.send({ user: req.user });
      return;
    }
    console.log(data);
    const Users = await User.find();
    const results = [];
    Users.map((i, index) => {
      if (i.username.slice(0, data.search.length).toLowerCase() == data.search.toLowerCase()) {
        if (i._id == req.user) {
          return;
        }
        // console.log("true")
        results.push(i);
      }
    });
    console.log(results)
    res.send({ data: results });
  } catch (error) {
    res.status(400).send({ error: "Something went wrong" });
    console.log(error);
  }
});

router.post("/passwordchange", async (req, res) => {
  try {
    const data = { ...req.body };
    console.log(data);
    if (data.password !== data.repeatPassword) {
      res.status(400).send({ error: "Passwords must be same" });
      return;
    }
    const hash = await bcrypt.hash(req.body.password, 10);
    data.password = hash;
    const newPassword = await User.findOneAndUpdate(
      { email: req.body.email.toLowerCase() },
      { password: data.password }
    );
    console.log(newPassword);
    res.send(newPassword);
  } catch (error) {
    res.status(400).send({ error: "Something went wrong" });
    console.log(error);
  }
});

router.post("/passwordchange/verify", async (req, res) => {
  try {
    const data = { ...req.body };
    const sameCode = await bcrypt.compare(data.code, data.codeHash);
    console.log(data);
    if (sameCode) {
      res.send({ secCode: true });
    } else {
      res.status(400).send({ error: "Wrong security code" });
    }
  } catch (error) {
    res.status(400).send({ error: "Something went wrong" });
    console.log(error);
  }
});

router.post("/passwordchange/email", async (req, res) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
      user: "together.app@hotmail.com",
      pass: "pass5445",
    },
  });
  const mailOptions = {
    from: "together.app@hotmail.com",
    to: req.body.email,
    subject: "Together account security code",
    html:
      '<table dir="ltr"><tbody><tr><td id="m_-3347290649743965137i1"style="' +
      "padding:0;font-family:'Segoe UI Semibold','Segoe UI Bold','Segoe UI','Helvetica Neue Medium',Arial,sans-serif;font-size:17px;color:#707070" +
      '"><span class="il">Togheter</span> account</td></tr><tr><td id="m_-3347290649743965137i2"style="' +
      "padding:0;font-family:'Segoe UI Light','Segoe UI','Helvetica Neue Medium',Arial,sans-serif;font-size:41px;color:#2672ec" +
      '">Security code</td></tr><tr><td id="m_-3347290649743965137i3"style="' +
      "padding:0;padding-top:25px;font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif;font-size:14px;color:#2a2a2a" +
      '">Please use the following security code for your Togheter account. </td></tr><tr><td id="m_-3347290649743965137i4"style="' +
      "padding:0;padding-top:25px;font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif;font-size:14px;color:#2a2a2a" +
      '">Security code: <spanstyle="' +
      "font-family:'Segoe UI Bold','Segoe UI Semibold','Segoe UI','Helvetica Neue Medium',Arial,sans-serif;font-size:14px;font-weight:bold;color:#2a2a2a" +
      '">' +
      code +
      '</spanstyle=></td></tr><tr><td id="m_-3347290649743965137i6"style="' +
      "padding:0;padding-top:25px;font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif;font-size:14px;color:#2a2a2a" +
      '">Thanks,</td></tr><tr><td id="m_-3347290649743965137i7"style="' +
      "padding:0;font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif;font-size:14px;color:#2a2a2a" +
      '">The <span class="il">Togheter</span> account team</td></tr></tbody></table>',
  };
  try {
    const existUser = await User.findOne({
      email: req.body.email.toLowerCase(),
    });
    if (existUser) {
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      console.log(code);
      res.send({ secCode: codeHash });
    } else {
      res.status(400).send({
        error: "We can't find account with this email. Please create new one",
      });
    }
  } catch (error) {
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.post("/signup", async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  const profileData = { ...req.body };
  console.log("profileData", profileData);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  console.log(code);
  const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
      user: "together.app@hotmail.com",
      pass: "pass5445",
    },
  });

  const mailOptions = {
    from: "together.app@hotmail.com",
    to: req.body.email,
    subject: "Together account security code",
    html:
      '<table dir="ltr"><tbody><tr><td id="m_-3347290649743965137i1"style="' +
      "padding:0;font-family:'Segoe UI Semibold','Segoe UI Bold','Segoe UI','Helvetica Neue Medium',Arial,sans-serif;font-size:17px;color:#707070" +
      '"><span class="il">Togheter</span> account</td></tr><tr><td id="m_-3347290649743965137i2"style="' +
      "padding:0;font-family:'Segoe UI Light','Segoe UI','Helvetica Neue Medium',Arial,sans-serif;font-size:41px;color:#2672ec" +
      '">Security code</td></tr><tr><td id="m_-3347290649743965137i3"style="' +
      "padding:0;padding-top:25px;font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif;font-size:14px;color:#2a2a2a" +
      '">Please use the following security code for your Togheter account. </td></tr><tr><td id="m_-3347290649743965137i4"style="' +
      "padding:0;padding-top:25px;font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif;font-size:14px;color:#2a2a2a" +
      '">Security code: <spanstyle="' +
      "font-family:'Segoe UI Bold','Segoe UI Semibold','Segoe UI','Helvetica Neue Medium',Arial,sans-serif;font-size:14px;font-weight:bold;color:#2a2a2a" +
      '">' +
      code +
      '</spanstyle=></td></tr><tr><td id="m_-3347290649743965137i6"style="' +
      "padding:0;padding-top:25px;font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif;font-size:14px;color:#2a2a2a" +
      '">Thanks,</td></tr><tr><td id="m_-3347290649743965137i7"style="' +
      "padding:0;font-family:'Segoe UI',Tahoma,Verdana,Arial,sans-serif;font-size:14px;color:#2a2a2a" +
      '">The <span class="il">Togheter</span> account team</td></tr></tbody></table>',
  };

  if (profileData.password !== profileData.repeatPassword) {
    res.status(400).send({ error: "Passwords must be same" });
    return;
  }
  profileData.password = hash;
  profileData.email = req.body.email.toLowerCase();
  try {
    const existUsername = await User.findOne({ username: req.body.username });
    if (existUsername) {
      res.status(400).send({ error: "Plese select another username" });
      return;
    }

    // const user = new User(profileData);
    // const data = await user.save();
    // console.log(data);
    // const token = jwt.sign({ id: data._id }, "tumo_students");

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    res.send({ data: profileData, secCode: codeHash });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.post("/fbsignup", async (req, res) => {
  const profileData = { ...req.body };
  console.log("profileData", profileData);
  try {
    const existEmail = await User.findOne({
      email: profileData.email.toLowerCase(),
    });
    if (existEmail) {
      const newPushToken = await User.findOneAndUpdate(
        { email: req.body.email.toLowerCase() },
        { pushToken: req.body.pushToken }
      );
      const token = jwt.sign({ id: existEmail._id }, "tumo_students");
      res.send({ auth_token: token });
      return;
    }
    const user = new User(profileData);
    const data = await user.save();
    const users = await User.find();
    for (let i = 0; i < users.length - 1; i++) {
      const messagesData = { userId: data._id, userId1: users[i]._id };
      const message = new Message(messagesData);
      const dataM = await message.save();
    }
    console.log(data);
    const newPushToken = await User.findOneAndUpdate(
      { email: req.body.email.toLowerCase() },
      { pushToken: req.body.pushToken }
    );
    const token = jwt.sign({ id: data._id }, "tumo_students");
    res.send({ auth_token: token });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error });
  }
});

router.post("/signup/test", async (req, res) => {
  const emaildata = req.body.email;
  try {
    const existEmail = await User.findOne({ email: emaildata.toLowerCase() });
    if (existEmail) {
      res.status(400).send({ error: "This email already exists" });
    } else if (req.body.email != "") {
      res.send({ email: emaildata });
      console.log(req.body.email);
    } else {
      res.status(400).send({ error: "required" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.get("/remove", check, async (req, res) => {
  try {
    const posts = await Post.find();
    for (let i = 0; i < posts.length; i++) {
      if (posts[i].userId._id == req.user) {
        const delPost = await Post.findOneAndDelete({ _id: posts[i]._id });
      }
    }
    for (let i = 0; i < posts.length; i++) {
      for (let y = 0; y < posts[i].likedpeople.length; y++) {
        if (posts[i].likedpeople[y] == req.user) {
          const data = await Post.findByIdAndUpdate(posts[i]._id, {
            likes: posts[i].likes - 1,
            $pull: { likedpeople: { $in: req.user } },
          });
        }
      }
    }

    for (let i = 0; i < posts.length; i++) {
      for (let y = 0; y < posts[i].likedpeople.length; y++) {
        if (posts[i].dislikedpeople[y] == req.user) {
          const data = await Post.findByIdAndUpdate(posts[i]._id, {
            dislikes: posts[i].dislikes - 1,
            $pull: { dislikedpeople: { $in: req.user } },
          });
        }
      }
    }

    const messages = await Message.find();
    for (let i = 0; i < messages.length; i++) {
      if (
        messages[i].userId._id == req.user ||
        messages[i].userId1._id == req.user
      ) {
        const delMessage = await Message.findOneAndDelete({
          _id: messages[i]._id,
        });
      }
    }
    const userData = await User.find();
    console.log(userData, req.user);
    for (let i = 0; i < userData.length; i++) {
      for (let y = 0; y < userData[i].followings.length; y++) {
        if (userData[i].followings[y] == req.user) {
          const data = await User.findByIdAndUpdate(userData[i]._id, {
            $pull: { followings: { $in: req.user } },
          });
        }
      }
    }
    for (let i = 0; i < userData.length; i++) {
      for (let y = 0; y < userData[i].followers.length; y++) {
        if (userData[i].followers[y] == req.user) {
          const data = await User.findByIdAndUpdate(userData[i]._id, {
            $pull: { followers: { $in: req.user } },
          });
        }
      }
    }
    const data = await User.findOneAndDelete({ _id: req.user });

    res.send(data);
  } catch (error) {
    res.status(400).send({ error: "Something went wrong" });
    console.log(error);
  }
});

router.get("/profile/:id", check, async (req, res) => {
  try {
    const id = req.params.id;
    if (id == "my" || id == req.user) {
      const data = await User.findById(req.user);
      res.send(data);
    } else {
      const data = await User.findById(id);
      let follow = false;
      data.followers.map((i, index) => {
        if (i == req.user) {
          follow = true;
        }
      });
      res.send({ data: data, followed: follow });
    }
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.get("/follow/:id/", check, async (req, res) => {
  try {
    const userid = req.user;
    const id = req.params.id;
    const UserData = await User.findByIdAndUpdate(userid, {
      $push: { followings: id },
    });
    const UserData1 = await User.findByIdAndUpdate(id, {
      $push: { followers: userid },
    });
    res.send({ update: "updated" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});
router.get("/unfollow/:id/", check, async (req, res) => {
  try {
    const userid = req.user;
    const id = req.params.id;
    const UserData = await User.findByIdAndUpdate(userid, {
      $pull: { followings: id },
    });
    const UserData1 = await User.findByIdAndUpdate(id, {
      $pull: { followers: userid },
    });
    res.send({ update: "updated" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});
module.exports = router;
