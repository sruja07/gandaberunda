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

const path = require('path');

// Generate Multi-Step Agent Plan from User Prompt
app.post('/api/plan', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  console.log(`[BACKEND API] Executing Python Agent Graph for prompt: "${prompt}"`);
  const scriptPath = path.join(__dirname, 'agent', 'run_agent.py');
  const rootDir = path.join(__dirname, '..');

  const { execFile } = require('child_process');
  execFile('python', [scriptPath, prompt], { cwd: rootDir }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[BACKEND API ERROR] Python execution failed:`, stderr || error);
      return res.status(500).json({ status: 'error', error: 'Agent graph execution failed', tasks: [], outputContent: null });
    }

    try {
      const jsonLine = stdout.split('\n').find(line => line.trim().startsWith('AGENT_OUTPUT_JSON:'));
      if (jsonLine) {
        const jsonString = jsonLine.trim().substring('AGENT_OUTPUT_JSON:'.length);
        const result = JSON.parse(jsonString);
        return res.json(result);
      }
      throw new Error('No AGENT_OUTPUT_JSON line found in python output.');
    } catch (parseError) {
      console.error(`[BACKEND API ERROR] Failed to parse agent output:`, parseError, stdout);
      return res.status(500).json({ status: 'error', error: 'Failed to parse agent graph output', tasks: [], outputContent: null });
    }
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
