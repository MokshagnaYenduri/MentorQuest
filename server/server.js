// server.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);

// Serve React frontend build
app.use(express.static(path.join(__dirname, 'client/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(() => {
    console.log('MongoDB connected');

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });
