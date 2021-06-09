const mongoose = require("mongoose");

const practiceQuestionSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: { type: String, required: true },
  description: { type: String, required: true },
  inputs: { type: String, required: true },
  outputs: { type: String, required: true },
  difficulty: { type: String, required: true },
  category: { type: String, required: true },
  pointsAllocated: { type: Number, required: true },
  testcases: [{
    inputs: String,
    outputs: String,
    title: String,
    description: String,
  }],
  level: { type: Number, required: true }
});

module.exports = mongoose.model("PracticeQuestion", practiceQuestionSchema);
