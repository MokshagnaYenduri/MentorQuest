const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {type: String},
    email: {type: String, required: true, unique: true},
    password: {type: String},
    googleId: { type: String},
    avatar: {type: String},
    role: { type: String, enum: ["student", "admin"], default: "student" }
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
