const mongoose = require("mongoose"),
      {XP} = require('../resources/constants');

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
  },
  password: { type: String, required: true },
  dob: { type: Date, required: true },
  institute: { type: String, required: true },
  xp: { type: String, default: XP.BEGINNER },
  score: { type: Number, default: 0 },
  attempts: {
    practice: [{
        question: { type: mongoose.Types.ObjectId, ref: 'PracticeQuestion'},
        passed: { type: Boolean },
        count: { type: Number, default: 1 }
      }],
    compete: [{
        question: { type: mongoose.Types.ObjectId, ref: 'CompeteQuestion'},
        passed: { type: Boolean },
        count: { type: Number, default: 1 }
      }],
  },
  completion: { type: Number, default: 1 }
});

module.exports = mongoose.model("User", userSchema);
