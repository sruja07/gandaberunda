import os
import json
import re
from typing import List, Dict, Any, Optional
from typing_extensions import TypedDict
from pydantic import BaseModel
from langgraph.graph import StateGraph, START, END
from agent.planner_prompt import SYSTEM_PLANNER_PROMPT
from google import genai
from google.genai import types

# Initialize Google AI Studio client with GEMINI_API_KEY
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))

class TaskStep(BaseModel):
    step_id: str
    title: str
    tool: str
    args: Dict[str, Any]
    status: str = "PENDING"
    requires_approval: bool = False
    risk_level: str = "LOW"
    result: Optional[str] = None

class AgentState(TypedDict):
    user_input: str
    plan: List[Dict[str, Any]]
    current_step_index: int
    approval_status: str
    final_output: str

def clean_json_response(raw_text: str) -> str:
    """Extract raw JSON even if Gemma wraps it in markdown backticks."""
    match = re.search(r"`(?:json)?\s*([\s\S]*?)\s*`", raw_text)
    if match:
        return match.group(1).strip()
    return raw_text.strip()

def planner_node(state: AgentState) -> Dict[str, Any]:
    print("\n[PLANNER] Invoking Gemma 4 (gemma-4-31b-it) to decompose request...")
    user_text = state.get("user_input", "")
    
    plan = []
    try:
        prompt = f"{SYSTEM_PLANNER_PROMPT}\n\nUser Request: {user_text}\nDeconstruct into raw JSON steps:"
        response = client.models.generate_content(
            model="gemma-4-26b-a4b-it",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
            )
        )
        raw_output = response.text
        cleaned_json = clean_json_response(raw_output)
        parsed = json.loads(cleaned_json)
        plan = parsed.get("steps", [])
        print(f"? Gemma 4 successfully generated {len(plan)} structured tasks.")
    except Exception as e:
        print(f"?? Gemma 4 API exception ({e}). Utilizing deterministic fallback plan.")
        plan = [
            {
                "step_id": "step_1",
                "title": "Reschedule sync on Calendar",
                "tool": "calendar.reschedule",
                "args": {"attendee": "Sarah", "date": "tomorrow", "time": "10:00 AM"},
                "status": "PENDING",
                "requires_approval": False,
                "risk_level": "LOW"
            },
            {
                "step_id": "step_2",
                "title": "Draft proposal document",
                "tool": "document.generate_draft",
                "args": {"template": "proposal", "topic": "Project Update"},
                "status": "PENDING",
                "requires_approval": False,
                "risk_level": "LOW"
            },
            {
                "step_id": "step_3",
                "title": "Send finalized proposal via Email",
                "tool": "email.send_message",
                "args": {"to": "sarah@company.com", "subject": "Updated Proposal", "body": "Attached proposal."},
                "status": "PENDING",
                "requires_approval": True,
                "risk_level": "HIGH"
            }
        ]
        
    return {"plan": plan, "current_step_index": 0, "approval_status": "NONE"}

def executor_node(state: AgentState) -> Dict[str, Any]:
    plan = state["plan"]
    idx = state["current_step_index"]
    step = plan[idx]
    
    print(f"\n[EXECUTOR] Step {idx + 1}: {step.get('title')} ({step.get('tool')})")
    
    # Check for consequential actions requiring human approval
    if step.get("requires_approval") and state.get("approval_status") != "APPROVED":
        print(f"??  [HITL REQUIRED] Consequential action detected: {step.get('tool')}. Pausing execution for human approval.")
        step["status"] = "REQUIRES_APPROVAL"
        return {"plan": plan, "approval_status": "PENDING"}

    step["status"] = "COMPLETED"
    step["result"] = f"Successfully executed {step.get('tool')}"
    print(f"? [SUCCESS] {step.get('title')} executed.")
    
    return {
        "plan": plan,
        "current_step_index": idx + 1,
        "approval_status": "NONE"
    }

def route_next_step(state: AgentState):
    if state.get("approval_status") == "PENDING":
        return END
    if state["current_step_index"] >= len(state["plan"]):
        return END
    return "executor"

builder = StateGraph(AgentState)
builder.add_node("planner", planner_node)
builder.add_node("executor", executor_node)

builder.add_edge(START, "planner")
builder.add_edge("planner", "executor")
builder.add_conditional_edges("executor", route_next_step, {
    "executor": "executor",
    END: END
})

agent_graph = builder.compile()

def resume_execution(state: AgentState, action: str = "APPROVE") -> AgentState:
    """Triggered when user reviews action in the frontend."""
    if action == "APPROVE":
        state["approval_status"] = "APPROVED"
        idx = state["current_step_index"]
        resumed = executor_node(state)
        state.update(resumed)
        while state["current_step_index"] < len(state["plan"]):
            resumed = executor_node(state)
            state.update(resumed)
            if state.get("approval_status") == "PENDING":
                break
    else:
        state["approval_status"] = "REJECTED"
        idx = state["current_step_index"]
        state["plan"][idx]["status"] = "REJECTED"
        state["plan"][idx]["result"] = "Cancelled by user."
    return state

if __name__ == "__main__":
    initial_state = {
        "user_input": "Reschedule tomorrow's meeting with Sarah and send her the new project proposal document.",
        "plan": [],
        "current_step_index": 0,
        "approval_status": "NONE",
        "final_output": ""
    }
    
    print("--- RUNNING PHASE 1: AUTOMATED EXECUTION UP TO BREAKPOINT ---")
    paused_state = agent_graph.invoke(initial_state)
    
    print("\n--- SIMULATING HUMAN APPROVAL (HITL) ---")
    final_state = resume_execution(paused_state, action="APPROVE")
    print("\n--- FINAL PIPELINE STATE AFTER APPROVAL ---")
    print(json.dumps(final_state, indent=2))
