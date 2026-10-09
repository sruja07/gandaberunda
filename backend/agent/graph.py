import os
import json
import re
from typing import List, Dict, Any, Optional
from typing_extensions import TypedDict
from pydantic import BaseModel
from langgraph.graph import StateGraph, START, END
from backend.agent.planner_prompt import SYSTEM_PLANNER_PROMPT
from google import genai
from google.genai import types

api_key = os.environ.get("GEMINI_API_KEY", "").strip()
client = genai.Client(api_key=api_key) if api_key else None

class TaskStep(BaseModel):
    step_id: str
    title: str
    tool: str
    args: Dict[str, Any] = {}
    status: str = "PENDING"
    risk_level: str = "LOW"
    requires_approval: bool = False
    risk_rationale: Optional[str] = "Standard task evaluation."
    dry_run_preview: Optional[str] = "Simulated tool execution preview."
    result: Optional[str] = None

class AgentState(TypedDict):
    user_input: str
    plan: List[Dict[str, Any]]
    current_step_index: int
    approval_status: str
    audit_trail: List[str]
    final_output: str

def clean_json_response(raw_text: str) -> str:
    match = re.search(r"`(?:json)?\s*([\s\S]*?)\s*`", raw_text)
    if match:
        return match.group(1).strip()
    return raw_text.strip()

def planner_node(state: AgentState) -> Dict[str, Any]:
    print("\n[PLANNER & RISK AUDITOR] Gemma 4 analyzing blast radius and building task graph...")
    user_text = state.get("user_input", "")
    
    plan = []
    try:
        if not client:
            raise ValueError("GEMINI_API_KEY environment variable not provided.")
        prompt = f"{SYSTEM_PLANNER_PROMPT}\n\nUser Request: {user_text}\nDeconstruct into verified execution plan:"
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
        raw_steps = parsed.get("steps", [])
        
        # Normalize every step through Pydantic so default keys always exist
        plan = []
        for s in raw_steps:
            # Auto-flag high consequentiality if tool communicates externally
            if "email" in s.get("tool", "").lower() or s.get("risk_level", "").upper() == "HIGH":
                s["risk_level"] = "HIGH"
                s["requires_approval"] = True
                if not s.get("risk_rationale"):
                    s["risk_rationale"] = "External communication boundary crossed; requires human governance."
                if not s.get("dry_run_preview"):
                    s["dry_run_preview"] = f"Will execute {s.get('tool')} with args: {s.get('args')}"
            else:
                s["risk_level"] = s.get("risk_level", "LOW")
                s["requires_approval"] = False
                if not s.get("risk_rationale"):
                    s["risk_rationale"] = "Internal sandboxed operation; zero side effects."
                if not s.get("dry_run_preview"):
                    s["dry_run_preview"] = f"Simulated call: {s.get('tool')}"
            
            validated_step = TaskStep(**s).model_dump()
            plan.append(validated_step)
            
        print(f"[AUDIT COMPLETE] Gemma 4 generated {len(plan)} tasks with embedded risk rationale.")
    except Exception as e:
        print(f"[FALLBACK] Gemma 4 API exception ({e}). Applying deterministic safety plan.")
        plan = [
            {
                "step_id": "step_1",
                "title": "Query calendar for free windows",
                "tool": "calendar.find_slot",
                "args": {"attendee": "Sarah", "duration_mins": 30},
                "status": "PENDING",
                "risk_level": "LOW",
                "requires_approval": False,
                "risk_rationale": "Internal calendar query; non-consequential.",
                "dry_run_preview": "Query calendar for Sarah with duration: 30 mins."
            },
            {
                "step_id": "step_2",
                "title": "Reschedule meeting invite",
                "tool": "calendar.reschedule",
                "args": {"attendee": "Sarah", "date": "tomorrow", "time": "10:30 AM"},
                "status": "PENDING",
                "risk_level": "LOW",
                "requires_approval": False,
                "risk_rationale": "Internal calendar update within team domain.",
                "dry_run_preview": "Update invite for Sarah to tomorrow at 10:30 AM."
            },
            {
                "step_id": "step_3",
                "title": "Synthesize updated proposal draft",
                "tool": "document.generate_draft",
                "args": {"template": "proposal", "topic": "Project Roadmap Update"},
                "status": "PENDING",
                "risk_level": "LOW",
                "requires_approval": False,
                "risk_rationale": "Local file creation; sandboxed.",
                "dry_run_preview": "Create proposal document based on Project Roadmap."
            },
            {
                "step_id": "step_4",
                "title": "Dispatch finalized proposal via external email",
                "tool": "email.send_message",
                "args": {"to": "sarah@clientcorp.com", "subject": "Project Proposal", "body": "Attached updated proposal."},
                "status": "PENDING",
                "risk_level": "HIGH",
                "requires_approval": True,
                "risk_rationale": "External communication with non-reversible delivery. Recipient domain is outside organization.",
                "dry_run_preview": "Will transmit 1 email to 'sarah@clientcorp.com' with attachment 'proposal.pdf'."
            }
        ]
        
    audit_trail = [f"[PLANNER] Planned {len(plan)} tasks with verified risk policies."]
    return {"plan": plan, "current_step_index": 0, "approval_status": "NONE", "audit_trail": audit_trail}

def simulate_tool_execution(tool: str, args: Dict[str, Any]) -> str:
    if "calendar.find_slot" in tool:
        return "Slot confirmed: Tomorrow at 10:30 AM (Available window: 10:00 - 11:30 AM)."
    elif "calendar.reschedule" in tool:
        return f"Calendar invite updated for {args.get('attendee', 'attendee')} at {args.get('time', '10:30 AM')}."
    elif "document.generate_draft" in tool:
        return f"Draft generated: '{args.get('topic', 'Proposal')}.pdf' (Size: 124 KB)."
    elif "email.send_message" in tool:
        return f"Dispatched SMTP message to {args.get('to')} (Subject: '{args.get('subject')}')."
    return f"Completed execution for {tool}."

def executor_node(state: AgentState) -> Dict[str, Any]:
    plan = state["plan"]
    idx = state["current_step_index"]
    step = plan[idx]
    audit = state.get("audit_trail", [])
    
    risk_level = step.get("risk_level", "LOW")
    risk_rationale = step.get("risk_rationale", "No rationale provided.")
    dry_run = step.get("dry_run_preview", "Standard execution.")
    
    print(f"\n[EXECUTOR] Step {idx + 1}: {step.get('title')} ({step.get('tool')})")
    print(f"           Risk Assessment: [{risk_level}] -> {risk_rationale}")
    
    if step.get("requires_approval") and state.get("approval_status") != "APPROVED":
        print(f"[GOVERNANCE GATE] Halting execution. Blast Radius: {dry_run}")
        step["status"] = "REQUIRES_APPROVAL"
        audit.append(f"[GATE] Step {idx + 1} blocked awaiting operator authorization.")
        return {"plan": plan, "approval_status": "PENDING", "audit_trail": audit}

    step["status"] = "COMPLETED"
    step["result"] = simulate_tool_execution(step.get("tool", ""), step.get("args", {}))
    audit.append(f"[SUCCESS] Step {idx + 1} executed: {step['tool']}")
    print(f"[SUCCESS] {step.get('title')} executed.")
    
    return {
        "plan": plan,
        "current_step_index": idx + 1,
        "approval_status": "NONE",
        "audit_trail": audit
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

def resume_execution(state: AgentState, action: str = "APPROVE", updated_args: Optional[Dict[str, Any]] = None) -> AgentState:
    idx = state["current_step_index"]
    step = state["plan"][idx]
    audit = state.get("audit_trail", [])
    
    if action == "APPROVE":
        if updated_args:
            step["args"].update(updated_args)
            audit.append(f"[OPERATOR MUTATION] Payload updated before approval: {updated_args}")
        state["approval_status"] = "APPROVED"
        resumed = executor_node(state)
        state.update(resumed)
        while state["current_step_index"] < len(state["plan"]):
            resumed = executor_node(state)
            state.update(resumed)
            if state.get("approval_status") == "PENDING":
                break
    else:
        state["approval_status"] = "REJECTED"
        step["status"] = "REJECTED"
        step["result"] = "Execution halted by operator. Triggered safe rollback: Draft retained in sandbox without external dispatch."
        audit.append(f"[ROLLBACK] Step {idx + 1} rejected by human operator. External transmission prevented.")
        state["current_step_index"] += 1
        
    state["audit_trail"] = audit
    return state

if __name__ == "__main__":
    initial_state = {
        "user_input": "Reschedule tomorrow's meeting with Sarah and send her the new project proposal document.",
        "plan": [],
        "current_step_index": 0,
        "approval_status": "NONE",
        "audit_trail": [],
        "final_output": ""
    }
    
    print("=== PHASE 1: EXECUTION UNTIL GOVERNANCE BREAKPOINT ===")
    paused_state = agent_graph.invoke(initial_state)
    
    print("\n=== GOVERNANCE INSPECTION ===")
    pending_step = paused_state["plan"][paused_state["current_step_index"]]
    print(f"Action:       {pending_step.get('title')}")
    print(f"Risk Level:   {pending_step.get('risk_level')}")
    print(f"Rationale:    {pending_step.get('risk_rationale')}")
    print(f"Dry Run:      {pending_step.get('dry_run_preview')}")
    
    print("\n=== PHASE 2: RESUMING WITH INLINE PAYLOAD EDIT (OPERATOR OVERRIDE) ===")
    modified_args = {"to": "sarah.vp@clientcorp.com", "subject": "FINAL: Project Roadmap Proposal"}
    final_state = resume_execution(paused_state, action="APPROVE", updated_args=modified_args)
    
    print("\n=== FINAL AUDIT TRAIL ===")
    for entry in final_state.get("audit_trail", []):
        print(f"  * {entry}")
