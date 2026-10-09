const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend service is running smoothly!' });
});

// Generate Multi-Step Agent Plan from User Prompt
app.post('/api/plan', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  console.log(`[BACKEND API] Received plan request: "${prompt}"`);

  // Return empty tasks and output until real AI agent engine is connected
  res.json({
    status: 'success',
    prompt: prompt,
    tasks: [],
    outputContent: null
  });
});

// Human-in-the-loop Approval Endpoint
app.post('/api/approve', (req, res) => {
  const { step_id, action = 'APPROVE' } = req.body;
  console.log(`[BACKEND API] Step approval action: ${step_id} -> ${action}`);

  res.json({
    status: 'success',
    step_id: step_id,
    approval_status: action === 'APPROVE' ? 'COMPLETED' : 'REJECTED',
    result: action === 'APPROVE' 
      ? 'Approved & executed by human operator via Backend API' 
      : 'Halted by human operator'
  });
});

app.listen(PORT, () => {
  console.log(`Gandaberundha Backend API running on port ${PORT}`);
});
