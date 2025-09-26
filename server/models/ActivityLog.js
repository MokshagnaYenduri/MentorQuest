const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  student: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  
  activityType: {
    type: String, 
    enum: ['question_solved', 'question_attempted', 'daily_login', 'streak_maintained', 'badge_earned', 'contest_participation'],
    required: true
  },
  
  details: {
    questionId: {type: mongoose.Schema.Types.ObjectId, ref: 'Question'},
    badgeId: {type: mongoose.Schema.Types.ObjectId, ref: 'Badge'},
    contestId: {type: mongoose.Schema.Types.ObjectId, ref: 'Contest'},
    pointsEarned: {type: Number, default: 0},
    streakCount: {type: Number},
    additionalData: {type: mongoose.Schema.Types.Mixed}
  },
  
  activityDate: {type: Date, default: Date.now}
}, {timestamps: true});

// Indexes for efficient querying
activityLogSchema.index({ student: 1, activityDate: -1 });
activityLogSchema.index({ activityType: 1, activityDate: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);