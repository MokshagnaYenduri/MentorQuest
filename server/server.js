const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { scheduleQuestionOfTheDay } = require('./utils/questionOfTheDay');
const path = require('path');

dotenv.config();
connectDB();

// Start the question of the day scheduler
scheduleQuestionOfTheDay();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ message: err.message || 'Server Error' });
});

// Serve React frontend
// Serve React frontend (Express 5 compatible)
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('(.*)', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
