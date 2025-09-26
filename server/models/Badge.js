const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {type: String, required: true, unique: true},
  description: {type: String, required: true},
  icon: {type: String}, // URL to badge image
  criteria: {
    type: {type: String, enum: ['problems_solved', 'streak', 'contest_participation', 'daily_activity'], required: true},
    value: {type: Number, required: true}, // threshold value
    timeframe: {type: String, enum: ['daily', 'weekly', 'monthly', 'all_time'], default: 'all_time'}
  },
  points: {type: Number, default: 100},
  isActive: {type: Boolean, default: true},
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
}, {timestamps: true});

module.exports = mongoose.model('Badge', badgeSchema);