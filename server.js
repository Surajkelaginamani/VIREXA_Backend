// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
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

app.post('/api/speak', async (req, res) => {
  const { text } = req.body;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2', 
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    // 🚨 THIS IS THE NEW DEBUGGING PART 🚨
    if (!response.ok) {
      const errorText = await response.text();
      console.error("ELEVENLABS REJECTED IT! Reason:", errorText);
      return res.status(500).json({ error: "ElevenLabs API failed", details: errorText });
    }

    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length
    });
    res.send(buffer);

  } catch (error) {
    console.error("SERVER CRASH:", error.message);
    res.status(500).json({ error: "Voice generation failed" });
  }
});
