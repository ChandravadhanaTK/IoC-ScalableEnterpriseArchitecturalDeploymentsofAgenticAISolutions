import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';

const app = express();
const DEFAULT_PORT = 5000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const HOST = process.env.HOST || '0.0.0.0';

// 2. Initialize Groq Client
const groq = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY,
}) : null;

// Configure Middlewares
app.use(cors({ origin: [
        "http://localhost:5173",
        "https://practical-essence-production-42ae.up.railway.app",
         "https://mindsupport-ai-frontend.onrender.com"
      ]
     })); // Matches default Vite frontend port
app.use(express.json());

// 1. Safety Interceptor Algorithm 
const checkCrisisKeywords = (text) => {
  const crisisKeywords = [
    'suicide', 'self-harm', 'kill myself', 'end my life', 
    'hurt myself', 'overdose', 'want to die', 'depressed and want to end it'
  ];
  return crisisKeywords.some(keyword => text.toLowerCase().includes(keyword));
};

// 2. Chat Streaming & Evaluation Endpoint
app.post('/api/chat/stream', async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message field cannot be empty." });
  }

  // Intercept data streams if user is in an active critical psychological state
  if (checkCrisisKeywords(message)) {
    return res.status(200).json({
      crisisTriggered: true,
      content: "CRISIS_DETECTED",
      suggestedHelpline: "9152987821 (Vandrevala Foundation India)"
    });
  }

  // Configure HTTP headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!groq) {
    res.write('The AI service is not configured yet. Please set GROQ_API_KEY to enable responses.');
    res.end();
    return;
  }

  try {
    // Build contextual prompt chaining
    // Safely terminate connection when generation concludes
    const formattedMessages = [
    { role: "system", content: "You are an empathetic peer-support companion..." },
    ...history.map(msg => ({ role: msg.role, content: msg.content })),
    { role: "user", content: message }
  ];

  // Call Groq instead of OpenAI using a fast, free open-source model
  const stream = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b", // Incredibly smart open-source model
    messages: formattedMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      res.write(content); 
    }
  }
  res.end();
} catch (error) {
    console.error("OpenAI Error:", error);
    res.write("System Notice: Internal AI processing issue. Please try again.");
    res.end();
  }
});

// app.listen(PORT, HOST, () => {
//   console.log(`[OK] Backend engine operational on http://${HOST}:${PORT}`);
// });
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});