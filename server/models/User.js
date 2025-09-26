const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String},
    googleId: { type: String},
    avatar: {type: String},
    role: { type: String, enum: ["student", "admin"], default: "student" },
    
    // Student specific fields
    totalPoints: {type: Number, default: 0},
    currentStreak: {type: Number, default: 0},
    maxStreak: {type: Number, default: 0},
    lastActiveDate: {type: Date},
    questionOfTheDay: {type: mongoose.Schema.Types.ObjectId, ref: 'Question'},
    questionOfTheDayDate: {type: Date},
    
    // Problem solving statistics by topic
    topicStats: [{
        topic: {type: String, required: true},
        totalQuestions: {type: Number, default: 0},
        solvedQuestions: {type: Number, default: 0},
        attemptedQuestions: {type: Number, default: 0}
    }],
    
    // Badges earned
    badges: [{
        badgeId: {type: mongoose.Schema.Types.ObjectId, ref: 'Badge'},
        earnedDate: {type: Date, default: Date.now}
    }],
    
    // Contest participation
    contestsParticipated: [{
        contestId: {type: mongoose.Schema.Types.ObjectId, ref: 'Contest'},
        participatedDate: {type: Date, default: Date.now},
        rank: {type: Number},
        score: {type: Number}
    }]
}, {timestamps: true});

userSchema.pre('save', async function (next) {
    if(!this.isModified('password')) {
        return next();
    }
    if(this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
