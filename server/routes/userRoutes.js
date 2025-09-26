const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  getDashboard,
  getQuestions,
  getQuestion,
  submitSolution,
  getProfile,
  getLeaderboard
} = require('../controllers/userController');

// Student dashboard
router.get('/dashboard', protect, getDashboard);

// Questions
router.get('/questions', protect, getQuestions);
router.get('/questions/:questionId', protect, getQuestion);
router.post('/questions/:questionId/submit', protect, submitSolution);

// Profile and statistics
router.get('/profile', protect, getProfile);

// Leaderboard
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;