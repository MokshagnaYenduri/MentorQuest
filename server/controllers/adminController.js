const Question = require('../models/Question');
const User = require('../models/User');
const Badge = require('../models/Badge');
const Submission = require('../models/Submission');
const StudentQuestion = require('../models/StudentQuestion');
const ActivityLog = require('../models/ActivityLog');

// Question management
exports.addQuestion = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      constraints, 
      difficulty, 
      tags, 
      points, 
      examples 
    } = req.body;
    
    const question = await Question.create({
      title,
      description,
      constraints,
      difficulty,
      tags,
      points,
      examples: examples || [],
      addedBy: req.user.id,
    });
    
    // Add new tags to database if they don't exist
    const existingTags = await Question.distinct('tags');
    const newTags = tags.filter(tag => !existingTags.includes(tag));
    
    res.status(201).json({
      question,
      newTags: newTags.length > 0 ? newTags : []
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      tags, 
      difficulty, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build filter
    let filter = {};
    
    if (tags) {
      filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }
    
    if (difficulty) {
      filter.difficulty = Array.isArray(difficulty) ? { $in: difficulty } : difficulty;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const questions = await Question.find(filter)
      .populate('addedBy', 'name email')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Question.countDocuments(filter);
    
    res.json({
      questions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + questions.length < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const question = await Question.findByIdAndUpdate(id, updates, { 
      new: true, 
      runValidators: true 
    }).populate('addedBy', 'name email');
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    
    // Also delete related submissions and student question records
    await Submission.deleteMany({ question: req.params.id });
    await StudentQuestion.deleteMany({ question: req.params.id });
    await ActivityLog.deleteMany({ 'details.questionId': req.params.id });
    
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question and related data deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuestionStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const question = await Question.findById(id).populate('addedBy', 'name email');
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Get submission statistics
    const submissionStats = await Submission.aggregate([
      { $match: { question: question._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get language usage
    const languageStats = await Submission.aggregate([
      { $match: { question: question._id } },
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get recent submissions
    const recentSubmissions = await Submission.find({ question: id })
      .populate('student', 'name email')
      .sort({ submissionTime: -1 })
      .limit(10);
    
    res.json({
      question,
      submissionStats,
      languageStats,
      recentSubmissions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Badge management
exports.createBadge = async (req, res) => {
  try {
    const { name, description, icon, criteria, points } = req.body;
    
    const badge = await Badge.create({
      name,
      description,
      icon,
      criteria,
      points: points || 100,
      createdBy: req.user.id
    });
    
    res.status(201).json(badge);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBadges = async (req, res) => {
  try {
    const badges = await Badge.find().populate('createdBy', 'name email');
    res.json(badges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const badge = await Badge.findByIdAndUpdate(id, updates, { 
      new: true, 
      runValidators: true 
    }).populate('createdBy', 'name email');
    
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    
    res.json(badge);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBadge = async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    if (!badge) return res.status(404).json({ message: 'Badge not found' });
    
    // Remove badge from all users
    await User.updateMany(
      { 'badges.badgeId': req.params.id },
      { $pull: { badges: { badgeId: req.params.id } } }
    );
    
    // Remove related activity logs
    await ActivityLog.deleteMany({ 'details.badgeId': req.params.id });
    
    await Badge.findByIdAndDelete(req.params.id);
    res.json({ message: 'Badge deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// User management
exports.getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      search,
      sortBy = 'totalPoints',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    if (role) {
      filter.role = role;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filter)
      .select('-password')
      .populate('badges.badgeId', 'name')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    
    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-password')
      .populate('badges.badgeId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user statistics
    const totalSolved = await StudentQuestion.countDocuments({
      student: id,
      status: 'solved'
    });
    
    const totalAttempted = await StudentQuestion.countDocuments({
      student: id,
      status: { $in: ['attempted', 'solved'] }
    });
    
    const recentActivity = await ActivityLog.find({ student: id })
      .populate('details.questionId', 'title')
      .populate('details.badgeId', 'name')
      .sort({ activityDate: -1 })
      .limit(20);
    
    res.json({
      user,
      statistics: {
        totalSolved,
        totalAttempted,
        topicStats: user.topicStats
      },
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove sensitive fields from updates
    delete updates.password;
    delete updates.googleId;
    
    const user = await User.findByIdAndUpdate(id, updates, { 
      new: true, 
      runValidators: true 
    }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Analytics and dashboard
exports.getDashboard = async (req, res) => {
  try {
    // Get overall statistics
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalQuestions = await Question.countDocuments({ isActive: true });
    const totalSubmissions = await Submission.countDocuments();
    const totalBadges = await Badge.countDocuments({ isActive: true });
    
    // Get recent activity
    const recentActivity = await ActivityLog.find()
      .populate('student', 'name email')
      .populate('details.questionId', 'title')
      .populate('details.badgeId', 'name')
      .sort({ activityDate: -1 })
      .limit(20);
    
    // Get top performers
    const topPerformers = await User.find({ role: 'student' })
      .select('name email totalPoints currentStreak')
      .sort({ totalPoints: -1 })
      .limit(10);
    
    // Get popular questions
    const popularQuestions = await Submission.aggregate([
      {
        $group: {
          _id: '$question',
          submissionCount: { $sum: 1 },
          successRate: {
            $avg: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'questions',
          localField: '_id',
          foreignField: '_id',
          as: 'question'
        }
      },
      {
        $unwind: '$question'
      },
      {
        $sort: { submissionCount: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Get submission trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const submissionTrends = await Submission.aggregate([
      {
        $match: { submissionTime: { $gte: thirtyDaysAgo } }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$submissionTime' 
            }
          },
          count: { $sum: 1 },
          solved: {
            $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      overview: {
        totalUsers,
        totalQuestions,
        totalSubmissions,
        totalBadges
      },
      recentActivity,
      topPerformers,
      popularQuestions,
      submissionTrends
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all available tags
exports.getTags = async (req, res) => {
  try {
    const tags = await Question.distinct('tags');
    res.json(tags.sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};