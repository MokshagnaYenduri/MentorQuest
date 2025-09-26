const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const {
  // Questions
  addQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  getQuestionStats,
  
  // Badges
  createBadge,
  getBadges,
  updateBadge,
  deleteBadge,
  
  // Users
  getUsers,
  getUserDetails,
  updateUser,
  
  // Dashboard and Analytics
  getDashboard,
  getTags
} = require('../controllers/adminController');

// Dashboard
router.get('/dashboard', protect, admin, getDashboard);

// Questions management
router.post('/questions', protect, admin, addQuestion);
router.get('/questions', protect, admin, getQuestions);
router.put('/questions/:id', protect, admin, updateQuestion);
router.delete('/questions/:id', protect, admin, deleteQuestion);
router.get('/questions/:id/stats', protect, admin, getQuestionStats);

// Badges management
router.post('/badges', protect, admin, createBadge);
router.get('/badges', protect, admin, getBadges);
router.put('/badges/:id', protect, admin, updateBadge);
router.delete('/badges/:id', protect, admin, deleteBadge);

// Users management
router.get('/users', protect, admin, getUsers);
router.get('/users/:id', protect, admin, getUserDetails);
router.put('/users/:id', protect, admin, updateUser);

// Utility routes
router.get('/tags', protect, admin, getTags);

module.exports = router;