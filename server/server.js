const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { scheduleQuestionOfTheDay } = require('./utils/questionOfTheDay');
const path = require('path'); // Needed for serving frontend

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Start the question of the day scheduler
scheduleQuestionOfTheDay();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const __dirname1 = path.resolve();

  // Serve static files from client/dist (Vite build output)
  app.use(express.static(path.join(__dirname1, 'client', 'dist')));

  // React Router fallback for all unmatched routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname1, 'client', 'dist', 'index.html'));
  });
}

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ message: err.message || 'Server Error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
