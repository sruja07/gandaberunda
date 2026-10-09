"use client";
import React, { useState } from 'react';
import { Send, Paperclip, Sparkles, Loader2, UserCircle } from 'lucide-react';
import { TaskStep } from '@/types/agent';
import TaskTimeline from '@/components/TaskTimeline';

export default function CopilotPage() {
  const [input, setInput] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [tasks, setTasks] = useState<TaskStep[]>([]);

  // Simulation Logic to make the demo "pop"
  const handleGeneratePlan = async () => {
    if (!input) return;
    setIsPlanning(true);
    setTasks([]);

    // 1. Simulated "Reasoning" Delay
    await new Promise(r => setTimeout(r, 1500));

    const mockPlan: TaskStep[] = [
      { step_id: '1', title: 'Analyzing your request and requirements', tool: 'reasoning_engine', args: {}, status: 'PENDING', requires_approval: false, risk_level: 'LOW' },
      { step_id: '2', title: 'Searching for relevant documents and data', tool: 'web_search', args: {}, status: 'PENDING', requires_approval: false, risk_level: 'LOW' },
      { step_id: '3', title: 'Executing sensitive account modifications', tool: 'system_api', args: {}, status: 'PENDING', requires_approval: true, risk_level: 'HIGH' },
      { step_id: '4', title: 'Generating final summary and report', tool: 'summarizer', args: {}, status: 'PENDING', requires_approval: false, risk_level: 'LOW' },
    ];
    
    setTasks(mockPlan);
    setIsPlanning(false);

    // 2. Execute steps automatically
    for (let i = 0; i < mockPlan.length; i++) {
      const id = mockPlan[i].step_id;
      setTasks(prev => prev.map(t => t.step_id === id ? { ...t, status: 'IN_PROGRESS' } : t));
      
      await new Promise(r => setTimeout(r, 2000));

      if (mockPlan[i].requires_approval) {
        setTasks(prev => prev.map(t => t.step_id === id ? { ...t, status: 'REQUIRES_APPROVAL' } : t));
        return; // Halt execution until approved
      }
      
      setTasks(prev => prev.map(t => t.step_id === id ? { ...t, status: 'COMPLETED', result: 'Completed successfully' } : t));
    }
  };

  const handleApprove = (id: string) => {
    setTasks(prev => prev.map(t => t.step_id === id ? { ...t, status: 'COMPLETED', result: 'Approved by user' } : t));
    // In a real app, this would trigger the next step in the backend
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Navbar */}
      <nav className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white">
            <Sparkles size={20} />
          </div>
          <span>Copilot<span className="text-blue-600">AI</span></span>
        </div>
        <UserCircle className="text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" size={32} />
      </nav>

      <main className="max-w-3xl mx-auto px-6 pb-32">
        <div className="text-center my-16">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">How can I help you today?</h1>
          <p className="text-slate-500 text-lg">Tell me your goal in plain English, and I'll handle the rest.</p>
        </div>

        {/* Execution Area */}
        <div className="mb-12">
          {tasks.length === 0 && !isPlanning && (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-white/50">
              <p>Your agent plan will appear here...</p>
            </div>
          )}

          {isPlanning && (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="font-medium text-slate-600">Thinking through the best plan...</p>
            </div>
          )}

          {!isPlanning && tasks.length > 0 && (
            <TaskTimeline tasks={tasks} onApprove={handleApprove} />
          )}
        </div>

        {/* Bottom Input Bar */}
        <div className="fixed bottom-8 left-0 right-0 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-2 focus-within:ring-2 ring-blue-500/20 transition-all">
              <div className="flex items-end gap-2 p-2">
                <button className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-slate-50 transition-all">
                  <Paperclip size={20} />
                </button>
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. Plan a 3-day trip to Tokyo and book the hotels..."
                  className="w-full bg-transparent border-none focus:ring-0 resize-none py-2 text-slate-900 max-h-32"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGeneratePlan();
                    }
                  }}
                />
                <button 
                  onClick={handleGeneratePlan}
                  disabled={!input || isPlanning}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl transition-all shadow-md shadow-blue-200"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
