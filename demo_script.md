# 3-Minute Hackathon Demo Script (`demo_script.md`)

**Project Title:** Agentic DAG Orchestrator with Human-in-the-Loop Safety  
**Speaker:** Lead Integration Presenter  
**Total Duration:** 180 Seconds (3:00)

---

## Pitch Timeline & Action Flow

### 0:00 - 0:45 | The Problem & High-Stakes Imperative
* **Speaker Visual:** Screen starts on empty Dashboard showing live system status.
* **Spoken Pitch:**
  > "Autonomous AI agents can write code, analyze images, and trigger external APIs. But in production systems, blind execution is a business liability. If an agent misinterprets an instruction and emails client data or wipes a database, there is no undo button. Existing agent frameworks either execute blindly or halt completely. We built an Agentic DAG Orchestrator powered by Gemma 4 that executes low-risk tasks autonomously while automatically inserting Human-in-the-Loop breakpoints for critical actions."

---

### 0:45 - 1:15 | Input Ingestion & Multimodal Planning
* **Action:**
  1. Paste Sample Prompt into the command console.
  2. Drag & drop `quarterly_budget_scan.png` into the multimodal context upload target.
* **Sample Input Data:**
  * **Prompt:**  
    `"Extract the key financial discrepancies from this budget visual, compile a summary report for management, and send an email draft to sarah@company.com requesting immediate approval for the $15,000 line-item adjustment."`
  * **File:** `quarterly_budget_scan.png` (Visual invoice with flagged items).
* **Spoken Pitch:**
  > "Watch what happens when we submit this messy, unstructured multi-step request along with an image scan. Instead of running a linear script, our backend routes the multimodal payload to Gemma 4."

---

### 1:15 - 2:00 | Real-Time DAG Graph Generation & Autonomous Execution
* **Action:** Click **[ Initialize Orchestrator ]**. UI immediately renders the generated Directed Acyclic Graph (DAG).
* **Visual Highlights on Dashboard:**
  * Node 1: `Extract Visual Data (OCR/Gemma 4 Vision)` -> **STATUS: EXECUTING -> COMPLETE** (Green glow)
  * Node 2: `Analyze Discrepancies & Draft Report` -> **STATUS: COMPLETE** (Green glow)
  * Node 3: `Send Email via External API` -> **STATUS: PAUSED / REQUIRES_APPROVAL** (Amber glowing outline)
* **Spoken Pitch:**
  > "Within seconds, Gemma 4 decomposes the prompt into an optimal Directed Acyclic Graph. Nodes 1 and 2—data extraction and text summarization—are zero-risk, so they execute in parallel without stopping. But notice Node 3: the system detects an external email action with high impact and automatically halts execution, setting status to `REQUIRES_APPROVAL`."

---

### 2:00 - 2:30 | The HITL Breakpoint Intercept (Approval Modal Live)
* **Action:**
  1. The `ApprovalModal.tsx` pops up automatically on the center screen with a high-visibility warning header.
  2. Point out the JSON diff payload viewer showing:
     * `To:` `sarah@company.com`
     * `Subject:` `URGENT: $15,000 Line-Item Adjustment Approval`
  3. Toggle the **"Edit Payload Parameters"** button, modify the subject line live to append `[CONFIRMED]`, and check the **Risk Acknowledgment Checkbox**.
  4. Click **`[ Approve & Execute ]`**.
* **Spoken Pitch:**
  > "Here is our interactive Human-in-the-Loop Breakpoint. The modal displays a clean diff of the exact payload Gemma 4 prepared. As an operator, I don't just inspect—I can edit the parameters live if needed. I check the risk acknowledgment, hit 'Approve & Execute', and send the execution trigger back to our FastAPI backend."

---

### 2:30 - 3:00 | Resolution, Execution Finalization & Logs
* **Action:**
  1. Approval Modal closes with a success check animation.
  2. Node 3 in the DAG turns bright Green (`SUCCESS`).
  3. Console execution panel displays live POST response from backend showing simulated API call dispatch (`200 OK - Email Sent`).
* **Spoken Pitch:**
  > "The backend receives the approval token, injects the validated payload, and completes the workflow end-to-end. We get full agent autonomy where it is safe, and total human oversight where it matters. Thank you!"

---

## Emergency Fallback & Contingency Plans

| Failure Scenario | Mitigation Strategy | Live Action |
| :--- | :--- | :--- |
| **Backend API Unreachable / Timeout** | Use Local Mock Server Fallback | Toggle `NEXT_PUBLIC_USE_MOCK=true` in console to use static state responses without breaking the UI demo flow. |
| **Gemma 4 Output Delay (> 5s)** | Pre-cached Graph Payload Trigger | Click hidden dev trigger `Ctrl + Shift + D` to instantly inject a pre-parsed valid DAG JSON structure into the UI. |
| **Multimodal Upload Fails** | Local File System Cache | Use pre-loaded asset path `/public/samples/quarterly_budget_scan.png` which skips client-side file reading. |
| **Live Network Drop** | Full Standalone Demo Mode | All API calls fall back to standard `setTimeout` promises returning valid mocked JSON data structures. |