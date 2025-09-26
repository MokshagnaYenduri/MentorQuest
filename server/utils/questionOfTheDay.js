const cron = require('node-cron');
const User = require('../models/User');
const Question = require('../models/Question');
const StudentQuestion = require('../models/StudentQuestion');

// Schedule to run every day at 11:58 PM to set question of the day for next day
const scheduleQuestionOfTheDay = () => {
  cron.schedule('58 23 * * *', async () => {
    try {
      console.log('Running Question of the Day selection...');
      
      // Get all students
      const students = await User.find({ role: 'student' });
      
      for (const student of students) {
        const questionOfTheDay = await selectQuestionOfTheDay(student._id);
        
        if (questionOfTheDay) {
          // Set question of the day for tomorrow
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          
          student.questionOfTheDay = questionOfTheDay._id;
          student.questionOfTheDayDate = tomorrow;
          await student.save();
          
          console.log(`Set QOTD for ${student.name}: ${questionOfTheDay.title}`);
        }
      }
      
      console.log('Question of the Day selection completed');
    } catch (error) {
      console.error('Error in Question of the Day selection:', error);
    }
  });
};

// Logic to select question of the day for a specific student
const selectQuestionOfTheDay = async (studentId) => {
  try {
    // Get student's topic statistics
    const student = await User.findById(studentId);
    const topicStats = student.topicStats || [];
    
    if (topicStats.length === 0) {
      // New user - suggest lowest difficulty question
      return await Question.findOne({ 
        isActive: true, 
        difficulty: 'cakewalk' 
      }).sort({ createdAt: 1 });
    }
    
    // Find the topic with least solved problems (where >= 1 problem exists)
    let selectedTopic = null;
    let minSolved = Infinity;
    
    for (const topicStat of topicStats) {
      if (topicStat.totalQuestions >= 1 && topicStat.solvedQuestions < minSolved) {
        minSolved = topicStat.solvedQuestions;
        selectedTopic = topicStat.topic;
      }
    }
    
    if (!selectedTopic) {
      // Fallback to any topic
      const allTags = await Question.distinct('tags', { isActive: true });
      selectedTopic = allTags[Math.floor(Math.random() * allTags.length)];
    }
    
    // Get all questions for the selected topic that student hasn't solved
    const solvedQuestionIds = await StudentQuestion.find({
      student: studentId,
      status: 'solved'
    }).distinct('question');
    
    const candidateQuestions = await Question.find({
      tags: selectedTopic,
      isActive: true,
      _id: { $nin: solvedQuestionIds }
    }).sort({ difficulty: 1, createdAt: 1 });
    
    if (candidateQuestions.length === 0) {
      // No unsolved questions in this topic, pick any unsolved question
      return await Question.findOne({
        isActive: true,
        _id: { $nin: solvedQuestionIds }
      }).sort({ difficulty: 1, createdAt: 1 });
    }
    
    // Find questions with the lowest difficulty
    const lowestDifficulty = candidateQuestions[0].difficulty;
    const lowestDifficultyQuestions = candidateQuestions.filter(
      q => q.difficulty === lowestDifficulty
    );
    
    // If multiple questions have the same lowest difficulty, pick random
    const randomIndex = Math.floor(Math.random() * lowestDifficultyQuestions.length);
    return lowestDifficultyQuestions[randomIndex];
    
  } catch (error) {
    console.error('Error selecting question of the day:', error);
    return null;
  }
};

// Function to manually trigger QOTD selection (for testing)
const triggerQuestionOfTheDay = async () => {
  const students = await User.find({ role: 'student' });
  
  for (const student of students) {
    const questionOfTheDay = await selectQuestionOfTheDay(student._id);
    
    if (questionOfTheDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      student.questionOfTheDay = questionOfTheDay._id;
      student.questionOfTheDayDate = today;
      await student.save();
    }
  }
  
  return 'Question of the Day updated for all students';
};

module.exports = {
  scheduleQuestionOfTheDay,
  triggerQuestionOfTheDay,
  selectQuestionOfTheDay
};