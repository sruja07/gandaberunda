/**
 * Mock Tool: searchDocs.js
 * Safety: Performs local memory search on provided document structures. Returns simulated: true.
 */

/**
 * Searches a collection of documents using multi-term keyword matching and ranking.
 * @param {Object} params - Tool parameters.
 * @param {string} params.query - Search query string.
 * @param {Array<Object>} params.documents - Array of doc objects { id, title, content }.
 * @returns {Object} Structured JSON result.
 */
function searchDocs(params = {}) {
  const { query, documents } = params;

  // Validate 'query'
  if (typeof query !== 'string' || query.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "Parameter 'query' must be a non-empty string."
      }
    };
  }

  // Validate 'documents'
  if (!Array.isArray(documents)) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "Parameter 'documents' must be an array."
      }
    };
  }

  const cleanQuery = query.trim().toLowerCase();
  const queryTerms = Array.from(new Set(cleanQuery.split(/\s+/).filter(Boolean)));

  if (queryTerms.length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: "Parameter 'query' contains no valid search terms."
      }
    };
  }

  const results = [];

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];

    // Skip malformed entries cleanly
    if (!doc || typeof doc !== 'object') continue;
    const docId = doc.id !== undefined ? String(doc.id) : `doc_${i}`;
    const title = typeof doc.title === 'string' ? doc.title : '';
    const content = typeof doc.content === 'string' ? doc.content : '';

    if (!title && !content) continue;

    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    const matchedTerms = [];
    let firstMatchIndex = -1;

    for (const term of queryTerms) {
      const inTitle = titleLower.includes(term);
      const inContent = contentLower.includes(term);

      if (inTitle || inContent) {
        matchedTerms.push(term);
        if (inContent) {
          const idx = contentLower.indexOf(term);
          if (firstMatchIndex === -1 || idx < firstMatchIndex) {
            firstMatchIndex = idx;
          }
        }
      }
    }

    const score = matchedTerms.length;

    if (score > 0) {
      // Build snippet around content match
      let snippet = content;
      if (content.length > 150) {
        if (firstMatchIndex !== -1) {
          const start = Math.max(0, firstMatchIndex - 30);
          const end = Math.min(content.length, firstMatchIndex + 120);
          snippet = (start > 0 ? '...' : '') + content.substring(start, end).trim() + (end < content.length ? '...' : '');
        } else {
          snippet = content.substring(0, 150).trim() + '...';
        }
      }

      results.push({
        id: docId,
        title: title || 'Untitled Document',
        matchedTerms,
        score,
        snippet,
        _originalIndex: i
      });
    }
  }

  // Sort by score descending (ties keep original index)
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a._originalIndex - b._originalIndex;
  });

  // Remove temporary sorting helper field
  const cleanResults = results.map(({ _originalIndex, ...rest }) => rest);

  return {
    success: true,
    tool: 'searchDocs',
    simulated: true,
    resultCount: cleanResults.length,
    results: cleanResults,
    message: 'Simulated document search completed successfully.'
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

  console.log('=== Running self-test for searchDocs.js ===\n');

  const sampleDocs = [
    { id: 'doc1', title: 'Architecture Overview', content: 'Node.js and Express backend setup for hackathon copilot.' },
    { id: 'doc2', title: 'Tool Specifications', content: 'Details on searchDocs, draftEmail, calendarReschedule, and slackNotify.' },
    { id: 'doc3', title: 'Meeting Notes', content: 'Discussed API integration boundaries and SSE events stream.' }
  ];

  // Test 1: Matching documents with correct ranking
  const res1 = searchDocs({ query: 'specifications searchDocs', documents: sampleDocs });
  assert(res1.success === true, 'Test 1a: Returns success: true');
  assert(res1.simulated === true, 'Test 1b: Returns simulated: true');
  assert(res1.resultCount === 1, 'Test 1c: Matched 1 document');
  assert(res1.results[0].id === 'doc2' && res1.results[0].score === 2, 'Test 1d: Top result doc2 has score 2 for matching title and content');

  // Test 2: No results
  const res2 = searchDocs({ query: 'unmatchedxyz123', documents: sampleDocs });
  assert(res2.success === true, 'Test 2a: No results still returns success: true');
  assert(res2.resultCount === 0 && res2.results.length === 0, 'Test 2b: resultCount is 0');

  // Test 3: Invalid input (empty query)
  const res3 = searchDocs({ query: '   ', documents: sampleDocs });
  assert(res3.success === false, 'Test 3a: Empty query returns success: false');
  assert(res3.error && res3.error.code === 'INVALID_INPUT', 'Test 3b: Correct error code for empty query');

  // Test 4: Invalid input (non-array documents)
  const res4 = searchDocs({ query: 'node', documents: 'not-an-array' });
  assert(res4.success === false, 'Test 4a: Non-array documents returns success: false');
  assert(res4.error && res4.error.code === 'INVALID_INPUT', 'Test 4b: Correct error code for non-array documents');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

module.exports = searchDocs;
