const express = require("express");
const bodyParser = require("body-parser");
const postsRoute = require("./routes/posts");
const messageRoute = require("./routes/messages");
const authRoute = require("./routes/auth");
const mongoose = require("mongoose");
const cors = require("cors");
const Pusher = require("pusher");
var multer = require("multer");
var upload = multer();
const app = express();
const port = process.env.PORT || 3333;
const pusher = new Pusher({
  appId: "1068277",
  key: "111c634f224bfb055def",
  secret: "5ce98a766133b5e00526",
  cluster: "ap2",
  encrypted: true,
});
const fetch = require("node-fetch");
const User = require("./model/user");
const { UserRefreshClient } = require("google-auth-library");
app.use(cors());
app.use(bodyParser.json());
app.use("/messages", messageRoute);
app.use("/auth", authRoute);
app.use("/posts", postsRoute);
mongoose.connect(
  "mongodb+srv://tumo-conf:tumo1234@cluster0.iyrq6.gcp.mongodb.net/tumo-conf?retryWrites=true&w=majority",
  {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("connected to db");
  }
);

const db = mongoose.connection;

async function sendPushNotification(messageDetails) {
  const user = await User.findOne({
    _id: messageDetails.user,
  });
  const user1 = await User.findOne({
    _id: messageDetails.user1,
  });
  if (user1.pushToken == null) {
    return;
  }
    const message = {
      to: user1.pushToken,
      sound: "default",
      title: user.username,
      body: messageDetails.message,
      priority: "normal",
      data: { someData: "goes here" },
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
}

db.once("open", () => {
  const changeStream = db.collection("messages").watch();
  changeStream.on("change", (change) => {
    if (change.operationType === "update") {
      const messageDetails = change.updateDescription.updatedFields;
      const key = Object.keys(messageDetails);
      if (key == "chat" && messageDetails.chat != []) {
        sendPushNotification(messageDetails.chat[0]);
        pusher.trigger("messages", "new", {
          message: messageDetails.chat[0].message,
          user: messageDetails.chat[0].user,
          user1: messageDetails.chat[0].user1,
          time: messageDetails.chat[0].time,
        });
      } else {
        sendPushNotification(messageDetails[key]);
        pusher.trigger("messages", "new", {
          message: messageDetails[key].message,
          user: messageDetails[key].user,
          user1: messageDetails[key].user1,
          time: messageDetails[key].time,
        });
      }
    } else {
      console.log(change.operationType);
    }
  });
  const changeStream1 = db.collection("posts").watch();
  changeStream1.on("change", (change) => {
    if (
      change.operationType === "insert" ||
      change.operationType === "delete" ||
      change.operationType === "update"
    ) {
      pusher.trigger("posts", "update", {});
    }
  });
  const changeStream2 = db.collection("users").watch();
  changeStream2.on("change", (change) => {
    if (change.operationType === "update") {
      pusher.trigger("users", "update", {});
    }
  });
});

app.listen(port, () => {
  console.log(`Running on ${port} port`);
});
