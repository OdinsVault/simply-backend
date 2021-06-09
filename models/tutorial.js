const mongoose = require("mongoose");

const tutorialSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  level: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});

module.exports = mongoose.model('Tutorial', tutorialSchema);
