const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  title: {type: String, required: true},
  description: {type: String, required: true},
  constraints: {type: String},
  difficulty: { 
    type: String, 
    enum: ["cakewalk", "easy", "easy-medium", "medium", "hard"], 
    required: true 
  },
  tags: [{type: String, required: true}],
  points: {type: Number, required: true, default: 10},
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Additional fields for better question management
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  
  // Statistics
  totalSubmissions: {type: Number, default: 0},
  successfulSubmissions: {type: Number, default: 0},
  
  // Status
  isActive: {type: Boolean, default: true}
}, { timestamps: true });

// Index for efficient querying
questionSchema.index({ tags: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model("Question", questionSchema);
