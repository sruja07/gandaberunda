/**
 * Mock Tool: calendarReschedule.js
 * Safety: Never modifies real calendars. Generates rescheduling proposals and returns simulated: true.
 */

/**
 * Creates a calendar rescheduling proposal (simulated).
 * @param {Object} params - Tool parameters.
 * @param {string} params.eventId - Event identifier.
 * @param {string} params.newDateTime - Proposed date/time string (ISO 8601 preferred).
 * @param {string} [params.reason] - Optional reason for rescheduling.
 * @param {string|string[]} [params.attendees] - Optional attendees list.
 * @returns {Object} Structured JSON result.
 */
function calendarReschedule(params = {}) {
  const { eventId, newDateTime, reason, attendees } = params;

  // Validate 'eventId'
  if (typeof eventId !== 'string' || eventId.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "Parameter 'eventId' must be a non-empty string."
      }
    };
  }

  // Validate 'newDateTime'
  if (!newDateTime || typeof newDateTime !== 'string') {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "Missing required parameter 'newDateTime'."
      }
    };
  }

  const parsedDate = new Date(newDateTime);
  if (isNaN(parsedDate.getTime())) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "Parameter 'newDateTime' must be a valid parseable date string."
      }
    };
  }

  const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const attendeesList = attendees ? (Array.isArray(attendees) ? attendees : [attendees]) : [];

  return {
    success: true,
    tool: 'calendarReschedule',
    simulated: true,
    action: 'CALENDAR_RESCHEDULE_PROPOSED',
    details: {
      proposalId,
      eventId: eventId.trim(),
      proposedDateTime: parsedDate.toISOString(),
      status: 'proposed',
      requiresApproval: true,
      reason: typeof reason === 'string' ? reason.trim() : '',
      attendees: attendeesList,
      createdAt: new Date().toISOString()
    },
    message: 'Simulated calendar reschedule proposal created. No real calendar was modified.'
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

  console.log('=== Running self-test for calendarReschedule.js ===\n');

  // Test 1: Valid input
  const res1 = calendarReschedule({
    eventId: 'evt_9988',
    newDateTime: '2026-10-15T14:00:00Z',
    reason: 'Sprint planning conflict',
    attendees: ['dev@example.com']
  });
  assert(res1.success === true, 'Test 1a: Returns success: true');
  assert(res1.simulated === true, 'Test 1b: Returns simulated: true');
  assert(res1.details.eventId === 'evt_9988', 'Test 1c: Correct eventId');
  assert(res1.details.proposedDateTime === '2026-10-15T14:00:00.000Z', 'Test 1d: Formatted ISO date');
  assert(res1.details.status === 'proposed' && res1.details.requiresApproval === true, 'Test 1e: Status is proposed with approval required');

  // Test 2: Missing event ID
  const res2 = calendarReschedule({
    newDateTime: '2026-10-15T14:00:00Z'
  });
  assert(res2.success === false, 'Test 2a: Missing eventId returns success: false');
  assert(res2.error && res2.error.code === 'INVALID_INPUT', 'Test 2b: Correct error code for missing eventId');

  // Test 3: Invalid date
  const res3 = calendarReschedule({
    eventId: 'evt_123',
    newDateTime: 'not-a-real-date'
  });
  assert(res3.success === false, 'Test 3a: Invalid date returns success: false');
  assert(res3.error && res3.error.code === 'INVALID_INPUT', 'Test 3b: Correct error code for invalid date');

  // Test 4: Missing date
  const res4 = calendarReschedule({
    eventId: 'evt_123'
  });
  assert(res4.success === false, 'Test 4a: Missing date returns success: false');
  assert(res4.error && res4.error.code === 'INVALID_INPUT', 'Test 4b: Correct error code for missing date');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

module.exports = calendarReschedule;
