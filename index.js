const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let objId;
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI,{useUnifiedTopology: true, useNewUrlParser: true});


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Define user schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }]
});

// Define exercise schema
const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Create a new user
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    const user = new User({ username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add exercises
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    const exercise = new Exercise({
      userId: _id,
      description,
      duration,
      date: date ? new Date(date) : new Date()
    });
    await exercise.save();

    const user = await User.findById(_id);
    user.exercises.push(exercise); // Assuming you have a 'exercises' field in your User model
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    let query = { userId: _id };
    if (from && to) {
      query.date = { $gte: new Date(from), $lte: new Date(to) };
    }

    let exercises = await Exercise.find(query)
      .select('description duration date')
      .limit(limit ? parseInt(limit) : undefined);

    const user = await User.findById(_id);
    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});






const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
