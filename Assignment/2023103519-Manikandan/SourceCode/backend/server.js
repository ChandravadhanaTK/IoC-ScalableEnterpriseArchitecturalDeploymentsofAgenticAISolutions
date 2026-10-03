const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const agentRoutes = require('./routes/agentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// API Routes
app.use('/api/agent', agentRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Agentic AI Enterprise Orchestrator API',
    author: 'Manikandan (Roll No: 2023103519)',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ Agentic AI Core Backend running on http://localhost:${PORT}`);
  console.log(`Author: Manikandan (Roll No: 2023103519)`);
  console.log(`====================================================`);
});
