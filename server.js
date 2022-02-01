const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

// Database connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  count: { type: Number, required: true },
  log: [exerciseSchema]
});

const User = mongoose.model("User", userSchema);

// Middlewares
app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', (req, res) => {
  let _username = req.body.username;

  User.findOne({ username: _username }, (err, user) => {
    if (err) return console.log(err);
    if (user) {
      res.json({ "username": user.username, "_id": user._id });
    } else {
      User.create({ username: _username, count: 0, log: [] }, (err, createdUser) => {
        res.json({ "username": createdUser.username, "_id": createdUser._id });
      });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
