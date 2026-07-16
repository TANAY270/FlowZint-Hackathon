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
