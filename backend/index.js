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
  const textLower = prompt.toLowerCase();

  let tasks = [];
  let outputContent = null;

  if (textLower.includes('leave') || textLower.includes('email') || textLower.includes('sick') || textLower.includes('vacation')) {
    tasks = [
      {
        step_id: 'step_1',
        title: `Analyzing request: "${prompt}"`,
        tool: 'reasoning_engine',
        args: { user_intent: prompt },
        status: 'COMPLETED',
        risk_level: 'LOW',
        requires_approval: false,
        result: 'Extracted leave duration & reason parameters'
      },
      {
        step_id: 'step_2',
        title: 'Drafting formal leave application email content',
        tool: 'email_writer',
        args: { recipient: 'Manager / HR', type: 'Leave Application' },
        status: 'COMPLETED',
        risk_level: 'LOW',
        requires_approval: false,
        result: 'Drafted professional leave email text'
      },
      {
        step_id: 'step_3',
        title: 'Dispatching leave request email to Manager',
        tool: 'system_api',
        args: { action: 'send_email', recipient: 'manager@company.com' },
        status: 'REQUIRES_APPROVAL',
        risk_level: 'HIGH',
        requires_approval: true,
        risk_rationale: 'External email dispatch crosses domain boundaries; operator authorization required.',
        dry_run_preview: "Will send 1 email to 'manager@company.com' with Subject 'Application for Leave of Absence'."
      },
      {
        step_id: 'step_4',
        title: 'Generating final response and copyable email template',
        tool: 'summarizer',
        args: {},
        status: 'PENDING',
        risk_level: 'LOW',
        requires_approval: false
      }
    ];

    outputContent = `Subject: Application for Leave of Absence\n\nDear Manager,\n\nI am writing to formally request a leave of absence for 2 days due to personal commitments.\n\nI have handed over my active tasks to the team to ensure zero disruption to workflow, and I will remain reachable for urgent matters.\n\nThank you for your understanding.\n\nSincerely,\n[Your Name]`;

  } else if (textLower.includes('tokyo') || textLower.includes('trip') || textLower.includes('travel') || textLower.includes('hotel')) {
    tasks = [
      {
        step_id: 'step_1',
        title: 'Analyzing travel dates & Shibuya hotel preferences',
        tool: 'reasoning_engine',
        args: { destination: 'Tokyo' },
        status: 'COMPLETED',
        risk_level: 'LOW',
        requires_approval: false,
        result: 'Identified 3-day Shibuya itinerary'
      },
      {
        step_id: 'step_2',
        title: 'Searching flights and Tokyo hotel availability',
        tool: 'web_search',
        args: { query: 'Shibuya Tokyo hotels flight options' },
        status: 'COMPLETED',
        risk_level: 'LOW',
        requires_approval: false,
        result: 'Found 4 hotel recommendations near Shibuya Crossing'
      },
      {
        step_id: 'step_3',
        title: 'Executing hotel & flight checkout payment',
        tool: 'system_api',
        args: { action: 'book_reservation', amount: 420 },
        status: 'REQUIRES_APPROVAL',
        risk_level: 'HIGH',
        requires_approval: true,
        risk_rationale: 'Financial transaction of $420 USD requires human confirmation.',
        dry_run_preview: "Will charge payment method $420.00 USD for Shibuya Excel Hotel Tokyu."
      },
      {
        step_id: 'step_4',
        title: 'Generating 3-day Tokyo travel itinerary summary',
        tool: 'summarizer',
        args: {},
        status: 'PENDING',
        risk_level: 'LOW',
        requires_approval: false
      }
    ];

    outputContent = `✈️ Tokyo 3-Day Travel Itinerary:\n\nDay 1: Shibuya Crossing, Meiji Shrine, and Harajuku.\nDay 2: Tsukiji Outer Market, Senso-ji Temple in Asakusa, and Tokyo Skytree.\nDay 3: Akihabara electronics district and Shinjuku Gyoen National Garden.\n\nRecommended Hotel: Shibuya Excel Hotel Tokyu ($140/night).`;

  } else {
    tasks = [
      {
        step_id: 'step_1',
        title: `Analyzing request: "${prompt}"`,
        tool: 'reasoning_engine',
        args: { user_input: prompt },
        status: 'COMPLETED',
        risk_level: 'LOW',
        requires_approval: false,
        result: 'Deconstructed goal into execution plan'
      },
      {
        step_id: 'step_2',
        title: 'Searching relevant knowledge base & documents',
        tool: 'web_search',
        args: { query: prompt },
        status: 'COMPLETED',
        risk_level: 'LOW',
        requires_approval: false,
        result: 'Fetched context and parameters'
      },
      {
        step_id: 'step_3',
        title: 'Executing system & database modification',
        tool: 'system_api',
        args: { payload: prompt },
        status: 'REQUIRES_APPROVAL',
        risk_level: 'HIGH',
        requires_approval: true,
        risk_rationale: 'High consequentiality system modification requires operator authorization.',
        dry_run_preview: `Will execute payload action: "${prompt}"`
      },
      {
        step_id: 'step_4',
        title: 'Generating final response summary and report',
        tool: 'summarizer',
        args: {},
        status: 'PENDING',
        risk_level: 'LOW',
        requires_approval: false
      }
    ];

    outputContent = `Processed request: "${prompt}"\n\nAll tasks verified and ready for execution.`;
  }

  res.json({
    status: 'success',
    prompt: prompt,
    tasks: tasks,
    outputContent: outputContent
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
