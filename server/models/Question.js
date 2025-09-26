const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  title: String,
  description: String,
  constraints: String,
  difficulty: { type: String, enum: ["cakewalk", "easy", "easy-medium", "medium", "hard"] },
  tags: [String],
  points: Number,
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);
