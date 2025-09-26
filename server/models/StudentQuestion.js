const mongoose = require('mongoose');

const studentQuestionSchema = new mongoose.Schema({
  student: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  question: {type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true},
  
  status: {
    type: String, 
    enum: ['not_attempted', 'attempted', 'solved'], 
    default: 'not_attempted'
  },
  
  attempts: {type: Number, default: 0},
  firstAttemptDate: {type: Date},
  solvedDate: {type: Date},
  lastAttemptDate: {type: Date},
  
  // Best submission details
  bestSubmission: {
    code: String,
    language: String,
    executionTime: Number,
    pointsEarned: Number
  },
  
  totalPointsEarned: {type: Number, default: 0}
}, {timestamps: true});

// Compound index to ensure one record per student-question pair
studentQuestionSchema.index({ student: 1, question: 1 }, { unique: true });
studentQuestionSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('StudentQuestion', studentQuestionSchema);