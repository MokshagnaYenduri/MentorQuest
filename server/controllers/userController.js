const Question = require('../models/Question');
const User = require('../models/User');
const Submission = require('../models/Submission');
const StudentQuestion = require('../models/StudentQuestion');
const ActivityLog = require('../models/ActivityLog');
const Badge = require('../models/Badge');

// Get student dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('badges.badgeId');
    
    // Get today's activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayActivities = await ActivityLog.find({
      student: userId,
      activityDate: { $gte: today, $lt: tomorrow }
    }).populate('details.questionId', 'title difficulty');
    
    // Get question of the day
    let questionOfTheDay = null;
    if (user.questionOfTheDay && user.questionOfTheDayDate) {
      const qodDate = new Date(user.questionOfTheDayDate);
      qodDate.setHours(0, 0, 0, 0);
      if (qodDate.getTime() === today.getTime()) {
        questionOfTheDay = await Question.findById(user.questionOfTheDay);
      }
    }
    
    // Get recent submissions
    const recentSubmissions = await Submission.find({ student: userId })
      .populate('question', 'title difficulty')
      .sort({ submissionTime: -1 })
      .limit(10);
    
    // Get leaderboard position
    const userRank = await User.countDocuments({ totalPoints: { $gt: user.totalPoints } }) + 1;
    
    res.json({
      user: {
        name: user.name,
        totalPoints: user.totalPoints,
        currentStreak: user.currentStreak,
        maxStreak: user.maxStreak,
        badges: user.badges,
        rank: userRank
      },
      questionOfTheDay,
      todayActivities,
      recentSubmissions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all questions with filters
exports.getQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      tags, 
      difficulty, 
      status, 
      search, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    let filter = { isActive: true };
    
    if (tags) {
      filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }
    
    if (difficulty) {
      filter.difficulty = Array.isArray(difficulty) ? { $in: difficulty } : difficulty;
    }
    
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Get questions
    const questions = await Question.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get student's progress for these questions
    const questionIds = questions.map(q => q._id);
    const studentProgress = await StudentQuestion.find({
      student: userId,
      question: { $in: questionIds }
    });
    
    // Create a map for quick lookup
    const progressMap = {};
    studentProgress.forEach(sp => {
      progressMap[sp.question.toString()] = sp;
    });
    
    // Combine questions with progress
    const questionsWithProgress = questions.map(question => {
      const progress = progressMap[question._id.toString()];
      return {
        ...question.toObject(),
        studentStatus: progress ? progress.status : 'not_attempted',
        attempts: progress ? progress.attempts : 0,
        totalPointsEarned: progress ? progress.totalPointsEarned : 0
      };
    });
    
    // Apply status filter after combining with progress
    let filteredQuestions = questionsWithProgress;
    if (status) {
      filteredQuestions = questionsWithProgress.filter(q => q.studentStatus === status);
    }
    
    const total = await Question.countDocuments(filter);
    
    res.json({
      questions: filteredQuestions,
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

// Get specific question details
exports.getQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;
    
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    const studentProgress = await StudentQuestion.findOne({
      student: userId,
      question: questionId
    });
    
    const submissions = await Submission.find({
      student: userId,
      question: questionId
    }).sort({ submissionTime: -1 });
    
    res.json({
      question: question.toObject(),
      progress: studentProgress || {
        status: 'not_attempted',
        attempts: 0,
        totalPointsEarned: 0
      },
      submissions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Submit solution
exports.submitSolution = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { code, language } = req.body;
    const userId = req.user.id;
    
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // For now, we'll mark all submissions as solved (in real app, you'd run tests)
    const status = 'solved';
    const pointsEarned = question.points;
    
    // Create submission
    const submission = await Submission.create({
      student: userId,
      question: questionId,
      code,
      language,
      status,
      pointsEarned,
      submissionTime: new Date()
    });
    
    // Update or create StudentQuestion record
    let studentQuestion = await StudentQuestion.findOne({
      student: userId,
      question: questionId
    });
    
    if (!studentQuestion) {
      studentQuestion = new StudentQuestion({
        student: userId,
        question: questionId,
        status: 'attempted',
        attempts: 1,
        firstAttemptDate: new Date()
      });
    }
    
    studentQuestion.attempts += 1;
    studentQuestion.lastAttemptDate = new Date();
    
    if (status === 'solved' && studentQuestion.status !== 'solved') {
      studentQuestion.status = 'solved';
      studentQuestion.solvedDate = new Date();
      studentQuestion.totalPointsEarned = pointsEarned;
      
      // Update best submission
      studentQuestion.bestSubmission = {
        code,
        language,
        executionTime: 0, // You'd measure this in real implementation
        pointsEarned
      };
      
      // Update user points and statistics
      const user = await User.findById(userId);
      user.totalPoints += pointsEarned;
      
      // Update topic statistics
      const questionTags = question.tags;
      questionTags.forEach(tag => {
        let topicStat = user.topicStats.find(ts => ts.topic === tag);
        if (!topicStat) {
          topicStat = { topic: tag, totalQuestions: 0, solvedQuestions: 0, attemptedQuestions: 0 };
          user.topicStats.push(topicStat);
        }
        topicStat.solvedQuestions += 1;
      });
      
      // Update streak
      await updateStreak(userId);
      
      await user.save();
      
      // Log activity
      await ActivityLog.create({
        student: userId,
        activityType: 'question_solved',
        details: {
          questionId,
          pointsEarned
        }
      });
      
      // Check for new badges
      await checkAndAwardBadges(userId);
    } else if (studentQuestion.status === 'not_attempted') {
      studentQuestion.status = 'attempted';
      
      // Log activity for first attempt
      await ActivityLog.create({
        student: userId,
        activityType: 'question_attempted',
        details: {
          questionId
        }
      });
    }
    
    await studentQuestion.save();
    
    // Update question statistics
    question.totalSubmissions += 1;
    if (status === 'solved') {
      question.successfulSubmissions += 1;
    }
    await question.save();
    
    res.json({
      submission,
      message: status === 'solved' ? 'Solution accepted!' : 'Keep trying!',
      pointsEarned: status === 'solved' ? pointsEarned : 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get student profile and statistics
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).populate('badges.badgeId');
    
    // Get detailed statistics
    const totalSolved = await StudentQuestion.countDocuments({
      student: userId,
      status: 'solved'
    });
    
    const totalAttempted = await StudentQuestion.countDocuments({
      student: userId,
      status: { $in: ['attempted', 'solved'] }
    });
    
    // Get difficulty-wise breakdown
    const difficultyStats = await StudentQuestion.aggregate([
      {
        $match: { student: userId, status: 'solved' }
      },
      {
        $lookup: {
          from: 'questions',
          localField: 'question',
          foreignField: '_id',
          as: 'questionData'
        }
      },
      {
        $unwind: '$questionData'
      },
      {
        $group: {
          _id: '$questionData.difficulty',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get recent activity
    const recentActivity = await ActivityLog.find({ student: userId })
      .populate('details.questionId', 'title')
      .populate('details.badgeId', 'name')
      .sort({ activityDate: -1 })
      .limit(20);
    
    res.json({
      user,
      statistics: {
        totalSolved,
        totalAttempted,
        difficultyBreakdown: difficultyStats,
        topicStats: user.topicStats
      },
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper function to update streak
async function updateStreak(userId) {
  const user = await User.findById(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
  
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      user.currentStreak += 1;
      user.maxStreak = Math.max(user.maxStreak, user.currentStreak);
    } else if (daysDiff > 1) {
      // Streak broken
      user.currentStreak = 1;
    }
    // Same day, no change needed
  } else {
    // First activity
    user.currentStreak = 1;
    user.maxStreak = 1;
  }
  
  user.lastActiveDate = new Date();
  await user.save();
  
  // Log streak activity
  await ActivityLog.create({
    student: userId,
    activityType: 'streak_maintained',
    details: {
      streakCount: user.currentStreak
    }
  });
}

// Helper function to check and award badges
async function checkAndAwardBadges(userId) {
  const user = await User.findById(userId);
  const badges = await Badge.find({ isActive: true });
  
  for (const badge of badges) {
    // Check if user already has this badge
    const hasBadge = user.badges.some(b => b.badgeId.toString() === badge._id.toString());
    if (hasBadge) continue;
    
    let shouldAward = false;
    
    switch (badge.criteria.type) {
      case 'problems_solved':
        const solvedCount = await StudentQuestion.countDocuments({
          student: userId,
          status: 'solved'
        });
        shouldAward = solvedCount >= badge.criteria.value;
        break;
        
      case 'streak':
        shouldAward = user.currentStreak >= badge.criteria.value;
        break;
        
      case 'daily_activity':
        // Check for consecutive days of activity
        shouldAward = user.currentStreak >= badge.criteria.value;
        break;
    }
    
    if (shouldAward) {
      user.badges.push({
        badgeId: badge._id,
        earnedDate: new Date()
      });
      
      user.totalPoints += badge.points;
      
      await ActivityLog.create({
        student: userId,
        activityType: 'badge_earned',
        details: {
          badgeId: badge._id,
          pointsEarned: badge.points
        }
      });
    }
  }
  
  await user.save();
}

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    
    const leaderboard = await User.find({ role: 'student' })
      .select('name avatar totalPoints currentStreak maxStreak')
      .sort({ totalPoints: -1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Add rank to each user
    const leaderboardWithRank = leaderboard.map((user, index) => ({
      ...user.toObject(),
      rank: skip + index + 1
    }));
    
    const total = await User.countDocuments({ role: 'student' });
    
    res.json({
      leaderboard: leaderboardWithRank,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};