/**
 * Mock Tool: slackNotify.js
 * Safety: Never posts real Slack messages. Simulates notification delivery and returns simulated: true.
 */

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Sends a simulated Slack notification.
 * @param {Object} params - Tool parameters.
 * @param {string} params.channel - Target Slack channel or user handle (e.g., '#general', '@alex').
 * @param {string} params.message - Message body text.
 * @returns {Object} Structured JSON result.
 */
function slackNotify(params = {}) {
  const { channel, message } = params;

  // Validate 'channel'
  if (typeof channel !== 'string' || channel.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "Parameter 'channel' must be a non-empty string."
      }
    };
  }

  const cleanChannel = channel.trim();

  // Validate 'message'
  if (typeof message !== 'string' || message.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "Parameter 'message' must be a non-empty string."
      }
    };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: `Parameter 'message' exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters.`
      }
    };
  }

  const notificationId = `slack_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  return {
    success: true,
    tool: 'slackNotify',
    simulated: true,
    action: 'SLACK_NOTIFICATION_SENT',
    details: {
      notificationId,
      channel: cleanChannel,
      message: message.trim(),
      status: 'simulated_sent',
      sentAt: timestamp
    },
    message: `Simulated Slack notification sent to ${cleanChannel}. No real Slack message was sent.`
  };
}

// Self-test runner when executed directly via CLI
if (require.main === module) {
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  console.log('=== Running self-test for slackNotify.js ===\n');

  // Test 1: Valid input
  const res1 = slackNotify({
    channel: '#general',
    message: 'Hello team, the backend tools build is progressing smoothly!'
  });
  assert(res1.success === true, 'Test 1a: Returns success: true');
  assert(res1.simulated === true, 'Test 1b: Returns simulated: true');
  assert(res1.details.channel === '#general', 'Test 1c: Correct channel');
  assert(res1.details.status === 'simulated_sent', 'Test 1d: Status simulated_sent');

  // Test 2: Missing channel
  const res2 = slackNotify({
    message: 'Hello team'
  });
  assert(res2.success === false, 'Test 2a: Missing channel returns success: false');
  assert(res2.error && res2.error.code === 'INVALID_INPUT', 'Test 2b: Correct error code for missing channel');

  // Test 3: Empty message
  const res3 = slackNotify({
    channel: '#general',
    message: '   '
  });
  assert(res3.success === false, 'Test 3a: Empty message returns success: false');
  assert(res3.error && res3.error.code === 'INVALID_INPUT', 'Test 3b: Correct error code for empty message');

  // Test 4: Overlong message
  const longMsg = 'x'.repeat(2001);
  const res4 = slackNotify({
    channel: '#general',
    message: longMsg
  });
  assert(res4.success === false, 'Test 4a: Overlong message returns success: false');
  assert(res4.error && res4.error.code === 'INVALID_INPUT', 'Test 4b: Correct error code for overlong message');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

module.exports = slackNotify;
