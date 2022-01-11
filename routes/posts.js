const express = require("express");
const Post = require("../model/post");
const User = require("../model/user");
const check = require("./checkToken");
const router = express.Router();
const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
let a;
var multer = require("multer");
var upload = multer({ dest: "uploads/" });

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/drive"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}
const folderId = "1hzfNYA0rhDazhNJJHm_k28-4iw8Oo6I0";

router.get("/", check, async (req, res) => {
  try {
    console.log(req.user);
    const data = await Post.find().populate(
      "userId",
      "fullname username email avatar _id"
    );
    res.send({ data: data, User: req.user });
  } catch (error) {
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.get("/post/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const data = await Post.findById(id).populate(
      "userId",
      "firstname lastname email avatar coverImgUrl _id"
    );
    res.send(data);
  } catch (error) {
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.post("/post/:id/like", check, async (req, res) => {
  const userid = req.user;
  const id = req.params.id;
  const like = { ...req.body };
  console.log("like", like);
  console.log("userid", userid);
  const postData = await Post.findById(id);
  try {
    if (like.like == "like") {
      console.log("like");
      const data = await Post.findByIdAndUpdate(id, {
        likes: postData.likes + 1,
        $push: { likedpeople: userid },
      });
      const UserData = await User.findByIdAndUpdate(userid, {
        $push: { likedposts: id },
      });
      res.send({update: "updated"});
    } else if (like.like == "dislike") {
      const data = await Post.findByIdAndUpdate(id, {
        dislikes: postData.dislikes + 1,
        $push: { dislikedpeople: userid },
      });
      const UserData = await User.findByIdAndUpdate(userid, {
        $push: { dislikedposts: id },
      });
      res.send({update: "updated"});
    } else if (like.like == "unlike") {
      const data = await Post.findByIdAndUpdate(id, {
        likes: postData.likes - 1,
        $pull: { likedpeople: { $in: userid } },
      });
      const UserData = await User.findByIdAndUpdate(userid, {
        $pull: { likedposts: { $in: id } },
      });
      res.send({update: "updated"});
    } else if (like.like == "undislike") {
      const data = await Post.findByIdAndUpdate(id, {
        dislikes: postData.dislikes - 1,
        $pull: { dislikedpeople: { $in: userid } },
      });
      const UserData = await User.findByIdAndUpdate(userid, {
        $pull: { dislikedposts: { $in: id } },
      });
      res.send({update: "updated"});
    }
  } catch (error) {
    res.status(400).send({ error: error });
    console.log(error);
  }
});

router.post("/add/:change", check, upload.single("image"), async (req, res) => {
  const profileData = { ...req.body };
  profileData.userId = req.user;
  console.log(req.file);
  const change = req.params.change;
  try {
    async function createFiles(auth) {
      let responseData;
      const bodyImg = req.file.path;
      const drive = google.drive({ version: "v3", auth });
      const res = await drive.files.create({
        requestBody: {
          mimeType: "image/jpg",
          parents: [folderId],
        },
        media: {
          mimeType: "image/jpg",
          body: fs.createReadStream(bodyImg),
        },
      });
      responseData = res.data;
      fs.unlinkSync(bodyImg);
      save(responseData);
    }
    fs.readFile("credentials.json", (err, content) => {
      if (err) return console.log("Error loading client secret file:", err);
      // Authorize a client with credentials, then call the Google Drive API.
      authorize(JSON.parse(content), createFiles);
    });
    async function save(imageData) {
      profileData.imgId = await imageData.id;
      if (change == "post") {
        const post = new Post(profileData);
        const data = await post.save();
        res.send(data);
      } else if (change == "avatar") {
        const oldAvatar = await User.findById(profileData.userId);
        console.log(oldAvatar.avatar);
        if (oldAvatar.avatar != "1dMQgruv8yU_MVa3f4BX9idns4kZ8aAJQ") {
          async function deleteFiles(auth) {
            let responseData;
            const drive = google.drive({ version: "v3", auth });
            const res = await drive.files.delete({
              fileId: oldAvatar.avatar,
            });
            responseData = res.data;

            save();
          }
          fs.readFile("credentials.json", (err, content) => {
            if (err)
              return console.log("Error loading client secret file:", err);
            // Authorize a client with credentials, then call the Google Drive API.
            authorize(JSON.parse(content), deleteFiles);
          });
        } else {
          save();
        }
        async function save() {
          const data = await User.findByIdAndUpdate(profileData.userId, {
            avatar: profileData.imgId,
          });
          res.send(data);
        }
      } else {
        const oldCover = await User.findById(profileData.userId);
        console.log(oldCover.coverImgUrl);
        if (oldCover.coverImgUrl != "1oVbFv9R-B5zFTN4yZLvJf_7mdo2yJzry") {
          async function deleteFiles(auth) {
            let responseData;
            const drive = google.drive({ version: "v3", auth });
            const res = await drive.files.delete({
              fileId: oldCover.coverImgUrl,
            });
            responseData = res.data;
            save();
          }
          fs.readFile("credentials.json", (err, content) => {
            if (err)
              return console.log("Error loading client secret file:", err);
            // Authorize a client with credentials, then call the Google Drive API.
            authorize(JSON.parse(content), deleteFiles);
          });
        } else {
          save();
        }
        async function save() {
          const data = await User.findByIdAndUpdate(profileData.userId, {
            coverImgUrl: profileData.imgId,
          });
          res.send(data);
        }
      }
    }
  } catch (error) {
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.get("/user/:userId", check, async (req, res) => {
  try {
    const data = await Post.find({ userId: req.params.userId }).populate(
      "userId",
      "firstname lastname email avatar coverImgUrl _id"
    );
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.get("/profile/:id", check, async (req, res) => {
  try {
    const id = req.params.id
    if(id == "my" || id == req.user){
      const data = await Post.find({ userId: req.user }).populate(
        "userId",
        "fullname username email avatar coverImgUrl _id"
      );
      res.send({ data: data, User: req.user });
    }else{
      const data = await Post.find({ userId: id }).populate(
        "userId",
        "fullname username email avatar coverImgUrl _id"
      );
      res.send({ data: data, User: req.user });
    }
    
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Something went wrong" });
  }
});

router.delete("/post/:id/delete", check, async (req, res) => {
  const id = req.params.id;
  try {
    const data = await Post.findById(id);
    const imgId = data.imgId;
    console.log(data);
    async function deleteFiles(auth) {
      let responseData;
      const drive = google.drive({ version: "v3", auth });
      const res = await drive.files.delete({
        fileId: imgId,
      });
      responseData = res.data;
      console.log(responseData);
      save();
    }
    fs.readFile("credentials.json", (err, content) => {
      if (err) return console.log("Error loading client secret file:", err);
      // Authorize a client with credentials, then call the Google Drive API.
      authorize(JSON.parse(content), deleteFiles);
    });
    async function save() {
      const userData = await User.find()
      for (let i = 0; i < userData.length; i++) {
        for (let y = 0; y < userData[i].likedposts.length; y++) {
          if (userData[i].likedposts[y] == id) {
            const data = await User.findByIdAndUpdate(userData[i]._id, {
              $pull: { likedposts: { $in: id } },
            });
          }
        }
      }
      for (let i = 0; i < userData.length; i++) {
        for (let y = 0; y < userData[i].dislikedposts.length; y++) {
          if (userData[i].dislikedposts[y] == id) {
            const data = await User.findByIdAndUpdate(userData[i]._id, {
              $pull: { dislikedposts: { $in: id } },
            });
          }
        }
      }
      const post = await Post.findByIdAndRemove(id);
      res.send(post);
    }
  } catch (error) {
    res.status(400).send({ error: "Something went wrong" });
  }
});

module.exports = router;
