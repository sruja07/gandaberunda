import sys
import json
import os

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.agent.graph import agent_graph, resume_execution

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No prompt provided"}))
        sys.exit(1)
        
    prompt = sys.argv[1]
    
    initial_state = {
        "user_input": prompt,
        "plan": [],
        "current_step_index": 0,
        "approval_status": "NONE",
        "audit_trail": [],
        "final_output": ""
    }
    
    try:
        final_state = agent_graph.invoke(initial_state)
        plan_steps = final_state.get("plan", [])
        
        # Build human readable summary output
        completed_items = [s for s in plan_steps if s.get("status") == "COMPLETED"]
        summary_lines = []
        for s in completed_items:
            if s.get("result"):
                summary_lines.append(f"• {s.get('title')}: {s.get('result')}")
                
        output_content = "\n".join(summary_lines) if summary_lines else f"Plan generated for: '{prompt}'"
        
        response = {
            "status": "success",
            "prompt": prompt,
            "tasks": plan_steps,
            "outputContent": output_content
        }
        print("AGENT_OUTPUT_JSON:" + json.dumps(response))
    except Exception as e:
        print("AGENT_OUTPUT_JSON:" + json.dumps({"status": "error", "error": str(e), "tasks": [], "outputContent": None}))

if __name__ == "__main__":
    main()
