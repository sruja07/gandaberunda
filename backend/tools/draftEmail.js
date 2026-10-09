/**
 * Mock Tool: draftEmail.js
 * Safety: Never sends real emails. Simulates draft creation and returns simulated: true.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

/**
 * Drafts an email (simulated).
 * @param {Object} params - Tool parameters.
 * @param {string|string[]} params.to - Recipient email address(es).
 * @param {string} params.subject - Email subject line.
 * @param {string} params.body - Email body text.
 * @param {string|string[]} [params.cc] - Optional CC recipient(s).
 * @param {string|string[]} [params.bcc] - Optional BCC recipient(s).
 * @returns {Object} Structured JSON result.
 */
function draftEmail(params = {}) {
  const { to, subject, body, cc, bcc } = params;

  // Validate 'to'
  if (!to) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "Missing required parameter 'to'."
      }
    };
  }

  const toList = Array.isArray(to) ? to : [to];
  if (toList.length === 0 || !toList.every(validateEmail)) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "Parameter 'to' must contain valid email address(es)."
      }
    };
  }

  // Validate 'subject'
  if (typeof subject !== 'string' || subject.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "Parameter 'subject' must be a non-empty string."
      }
    };
  }

  // Validate 'body'
  if (typeof body !== 'string' || body.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "Parameter 'body' must be a non-empty string."
      }
    };
  }

  // Validate optional 'cc' and 'bcc'
  const ccList = cc ? (Array.isArray(cc) ? cc : [cc]) : [];
  if (ccList.length > 0 && !ccList.every(validateEmail)) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "Parameter 'cc' must contain valid email address(es)."
      }
    };
  }

  const bccList = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [];
  if (bccList.length > 0 && !bccList.every(validateEmail)) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "Parameter 'bcc' must contain valid email address(es)."
      }
    };
  }

  // Generate simulated draft payload
  const draftId = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  return {
    success: true,
    tool: 'draftEmail',
    simulated: true,
    action: 'EMAIL_DRAFT_CREATED',
    details: {
      draftId,
      to: toList,
      cc: ccList,
      bcc: bccList,
      subject: subject.trim(),
      body: body.trim(),
      createdAt: timestamp
    },
    message: `Simulated email draft created successfully for ${toList.join(', ')}.`
  };
}

// Self-test when executed directly via CLI
if (require.main === module) {
  console.log('=== Running self-test for draftEmail.js ===\n');

  console.log('1. Testing Valid Input:');
  const validResult = draftEmail({
    to: 'alex@example.com',
    subject: 'Hackathon Sync',
    body: 'Hi Alex, let us sync up at 3 PM today to discuss tool integration.'
  });
  console.log(JSON.stringify(validResult, null, 2));

  console.log('\n2. Testing Invalid Input (Missing recipient):');
  const invalidResult = draftEmail({
    subject: 'Missing Recipient',
    body: 'This should fail validation.'
  });
  console.log(JSON.stringify(invalidResult, null, 2));
}

module.exports = draftEmail;
