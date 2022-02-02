const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

// Database connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: new Date() }
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

app.route('/api/users').post((req, res) => {
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
}).get((req, res) => {
  User.find({}, (err, userList) => {
    if (err) return console.log(err);

    // Extract just username and _id from user for displaying in response
    let formattedList = [];
    userList.forEach((user, i) => {
      formattedList.push({ "username": user.username, "_id": user._id });
    });
    res.json(formattedList);
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  let __id = req.body[":_id"];
  let _description = req.body.description;
  let _duration = Number(req.body.duration); // Convert received text type to number
  let _date;

  // Check if date field is filled in
  if (req.body.date) {
    _date = new Date(req.body.date).toDateString(); // Format date display
  } else {
    _date = new Date().toDateString();
  }

  // Check if all required fields are filled in
  if (__id && _description && _duration) {
    User.findById(__id, (err, user) => {
      if (err) return console.log(err);
      if (user) {
        let exerciseLog = user.log;
        exerciseLog.push({ description: _description, duration: _duration, date: _date });
        user.count = exerciseLog.length;
        // Save modifications
        user.save((err, updated) => {
          if (err) return console.log(err);
          console.log(_date);
          res.json({ "_id": updated._id, username: updated.username, date: _date, duration: _duration, description: _description });
        });
      } else {
          res.json({ error: "user not found" });
      }
    });
  } else {
    res.json({ error: "required fields are not all filled in" });
  }
});

app.get('/api/users/:_id/logs', (req, res) => {
  let unix_from = new Date(req.query.from).getTime();
  let unix_to = new Date(req.query.to).getTime();
  let limit = req.query.limit;
  let duration = unix_to - unix_from;
  let __id = req.params._id;

  User.findById(__id, (err, user) => {
    if (err) return res.json({ error: err.message});
    let log = user.log;

    // Check if user made queries
    if (duration || duration == 0) {
      let filteredLog = [];

      // Use for loop instead of forEach function as break is not applicable with the latter
      for (let exercise of log) {
        let unix_date = new Date(exercise.date).getTime();

        // Check if exercise is within queried date
        if (unix_from <= unix_date && unix_date <= unix_to) {
            filteredLog.push({ description: exercise.description, duration: exercise.duration, date: new Date(exercise.date).toDateString() });
        }
        // Check if there is a limit to log display and if it has been reached
        if (limit && filteredLog.length == limit) {
          break;
        }
      }
      res.json({ username: user.username, count: filteredLog.length, "_id": user._id, log: filteredLog });
    }
    else {
      let formattedLog = [];
      for(let exercise of log) {
          formattedLog.push({ description: exercise.description, duration: exercise.duration, date: new Date(exercise.date).toDateString() });

          // Check if there is a limit to log display and if it has been reached
          if (limit && formattedLog.length == limit) {
            break;
          }
      }
      res.json({ username: user.username, count: formattedLog.length, "_id": user._id, log: formattedLog });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
