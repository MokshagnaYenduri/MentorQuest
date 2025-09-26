const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  question: {type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true},
  
  code: {type: String, required: true},
  language: {type: String, enum: ['javascript', 'python', 'java', 'cpp'], required: true},
  
  status: {type: String, enum: ['solved', 'attempted', 'partial'], required: true},
  
  // Submission details
  submissionTime: {type: Date, default: Date.now},
  executionTime: {type: Number}, // in milliseconds
  
  // Points awarded
  pointsEarned: {type: Number, default: 0},
  
  // Additional tracking
  isQuestionOfTheDay: {type: Boolean, default: false}
}, {timestamps: true});

// Indexes for efficient querying
submissionSchema.index({ student: 1, question: 1 });
submissionSchema.index({ student: 1, submissionTime: -1 });
submissionSchema.index({ question: 1, status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);