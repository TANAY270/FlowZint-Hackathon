require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { processMessage } = require('./orchestrator');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Flowzint Backend Orchestrator is running.' });
});

// Database explorer endpoint
const { mockOrders } = require('./tools/mockTools');
app.get('/api/orders', (req, res) => {
  res.json(mockOrders);
});

// Voice TTS endpoint using ElevenLabs
app.post('/api/voice/tts', async (req, res) => {
  const { text, voiceId = 'pNInz6obpgDQGcFmaJgB' } = req.body; // Default voice: Adam

  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // Updated to supported model
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('ElevenLabs API Error:', errText);
      return res.status(response.status).json({ error: 'Failed to generate speech' });
    }

    // Stream the audio directly back to the client
    res.set('Content-Type', 'audio/mpeg');
    
    // Convert Web ReadableStream to Node Readable Stream if needed, but in Node 18+ we can just pipe the body if it's a stream, or just send a buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);

  } catch (error) {
    console.error('Error generating TTS:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat completion / resolution endpoint
app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'Missing sessionId or message parameter.' });
  }

  try {
    const result = await processMessage(sessionId, message);
    res.json(result);
  } catch (error) {
    console.error('Error handling chat message:', error);
    res.status(500).json({ error: 'An internal server error occurred while processing the message.' });
  }
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Flowzint Orchestration Server running on port ${PORT}`);
  console.log(`🤖 Mode: ${process.env.GROQ_API_KEY ? 'Real LLM (Groq)' : 'Local Heuristic Simulation'}`);
  console.log(`=================================================`);
});
