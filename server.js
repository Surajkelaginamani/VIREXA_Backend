// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const configuredFrontendOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...configuredFrontendOrigins,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'https://virexafrontend.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    const isVercelPreview = /^https:\/\/virexafrontend.*\.vercel\.app$/.test(origin || '');

    if (!origin || allowedOrigins.includes(origin) || isVercelPreview) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  }
}));
app.use(express.json());

const getDbStatus = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
};

if (!process.env.MONGO_URI) {
  console.error("Missing MONGO_URI environment variable");
} else {
  mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  })
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB connection failed:", err.message));
}

app.get('/', (req, res) => {
  res.json({
    message: 'Virexa backend is running',
    dbStatus: getDbStatus()
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();

  res.status(dbStatus === 'connected' ? 200 : 503).json({
    ok: dbStatus === 'connected',
    dbStatus
  });
});

app.use('/api/chat', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database is not connected',
      dbStatus: getDbStatus()
    });
  }

  next();
});

app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
