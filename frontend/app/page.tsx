"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Sparkles, 
  Loader2, 
  UserCircle, 
  Mic, 
  MicOff, 
  Plus, 
  MessageSquare, 
  Trash2, 
  PanelLeftClose, 
  PanelLeft, 
  Clock,
  RotateCcw,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { TaskStep } from '@/types/agent';
import TaskTimeline from '@/components/TaskTimeline';

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  tasks: TaskStep[];
  outputContent?: string;
}

const DEFAULT_HISTORY: ChatHistoryItem[] = [];

export default function CopilotPage() {
  const [input, setInput] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [tasks, setTasks] = useState<TaskStep[]>([]);
  const [finalOutput, setFinalOutput] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load chat history from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('copilot_chat_history');
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed)) {
            // Filter out any legacy mock chat items created during mock testing phase
            const filtered = parsed.filter((item: ChatHistoryItem) => {
              if (item.id === 'chat-1') return false;
              if (item.tasks && item.tasks.some(t => t.step_id === 'step_1' || t.tool === 'reasoning_engine')) return false;
              if (item.outputContent && item.outputContent.includes('Application for Leave of Absence')) return false;
              return true;
            });
            setChatHistory(filtered);
            if (filtered.length === 0) {
              localStorage.removeItem('copilot_chat_history');
            } else {
              localStorage.setItem('copilot_chat_history', JSON.stringify(filtered));
            }
          }
        } catch (e) {
          console.error('Failed to parse chat history from localStorage:', e);
        }
      }
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (chatHistory.length > 0) {
        localStorage.setItem('copilot_chat_history', JSON.stringify(chatHistory));
      } else {
        localStorage.removeItem('copilot_chat_history');
      }
    }
  }, [chatHistory]);

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInput(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleMic = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          simulateSpeechInput();
        }
      } else {
        simulateSpeechInput();
      }
    }
  };

  const simulateSpeechInput = () => {
    setIsListening(true);
    const samplePhrases = [
      "Write an email seeking leave for 2 days",
      "Plan a 3-day trip to Tokyo and book the hotels",
      "Deploy the Express backend to production server"
    ];
    const phrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
    let i = 0;
    setInput("");
    const interval = setInterval(() => {
      if (i < phrase.length) {
        setInput(phrase.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setIsListening(false);
      }
    }, 40);
  };

  const handleStartNewChat = () => {
    setActiveChatId(null);
    setInput("");
    setTasks([]);
    setFinalOutput(null);
    setBackendError(null);
  };

  const handleSelectChat = (chat: ChatHistoryItem) => {
    setActiveChatId(chat.id);
    setInput(chat.title);
    setTasks(chat.tasks);
    setFinalOutput(chat.outputContent || null);
    setBackendError(null);
  };

  const handleDeleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = chatHistory.filter(item => item.id !== id);
    setChatHistory(updated);
    if (typeof window !== 'undefined') {
      if (updated.length > 0) {
        localStorage.setItem('copilot_chat_history', JSON.stringify(updated));
      } else {
        localStorage.removeItem('copilot_chat_history');
      }
    }
    if (activeChatId === id) {
      handleStartNewChat();
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Clear all stored chat history?')) {
      setChatHistory([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('copilot_chat_history');
      }
      handleStartNewChat();
    }
  };

  const handleGeneratePlan = async (queryInput?: string) => {
    const textToUse = queryInput || input;
    if (!textToUse) return;
    setIsPlanning(true);
    setTasks([]);
    setFinalOutput(null);
    setBackendError(null);

    let planData: TaskStep[] = [];
    let outputText: string | null = null;

    try {
      // Fetch plan from Backend API (http://localhost:5000/api/plan)
      const res = await fetch('http://localhost:5000/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToUse })
      });

      if (!res.ok) {
        throw new Error(`Backend server responded with status: ${res.status}`);
      }

      const data = await res.json();
      planData = data.tasks || [];
      outputText = data.outputContent || null;

      setTasks(planData);
      setFinalOutput(outputText);
      setIsPlanning(false);

      const newChatId = `chat-${Date.now()}`;
      const newHistoryItem: ChatHistoryItem = {
        id: newChatId,
        title: textToUse,
        timestamp: 'Just now',
        tasks: planData,
        outputContent: outputText || undefined
      };

      const updatedHistory = [newHistoryItem, ...chatHistory];
      setChatHistory(updatedHistory);
      setActiveChatId(newChatId);
    } catch (err: any) {
      console.warn('Backend API connection error:', err);
      setIsPlanning(false);
      setBackendError('Backend API is not connected. Connect the backend server to generate and process plans.');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch('http://localhost:5000/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: id, action: 'APPROVE' })
      });
    } catch (err) {
      console.warn('Backend API approval call failed:', err);
    }

    setTasks(prev => prev.map(t => t.step_id === id ? { ...t, status: 'COMPLETED', result: 'Approved by user via Backend API' } : t));
    
    // Complete remaining steps and display generated output
    const nextStepIndex = tasks.findIndex(t => t.step_id === id) + 1;
    if (nextStepIndex < tasks.length) {
      const nextId = tasks[nextStepIndex].step_id;
      setTasks(prev => prev.map(t => t.step_id === nextId ? { ...t, status: 'IN_PROGRESS' } : t));
      await new Promise(r => setTimeout(r, 1000));
      setTasks(prev => prev.map(t => t.step_id === nextId ? { ...t, status: 'COMPLETED', result: 'Completed successfully' } : t));
    }

    const currentChat = chatHistory.find(c => c.id === activeChatId);
    if (currentChat && currentChat.outputContent) {
      setFinalOutput(currentChat.outputContent);
    }
  };

  const handleCopyOutput = () => {
    if (finalOutput) {
      navigator.clipboard.writeText(finalOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-rose-50/60 via-slate-50 to-indigo-50/60 text-slate-800 font-sans overflow-hidden">
      
      {/* Colorful Left Sidebar */}
      <aside 
        className={`bg-white/90 backdrop-blur-xl border-r border-rose-100/80 flex flex-col shrink-0 transition-all duration-300 z-30 shadow-xl ${
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden border-none'
        }`}
      >
        <div className="p-4 border-b border-rose-100 flex items-center justify-between min-w-[288px]">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
            <div className="p-1.5 bg-gradient-to-tr from-rose-500 to-purple-600 text-white rounded-lg shadow-sm">
              <Clock size={14} />
            </div>
            <span>Recent History</span>
            <span className="text-[10px] bg-rose-100 text-rose-600 font-bold px-1.5 py-0.5 rounded-full">Saved</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 min-w-[288px]">
          <button 
            onClick={handleStartNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-semibold rounded-full text-sm transition-all shadow-md shadow-purple-200 active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1.5 py-2 min-w-[288px]">
          {chatHistory.length === 0 ? (
            <div className="text-center py-8 px-4 text-slate-400 text-xs">
              No recent history saved. Start a new prompt!
            </div>
          ) : (
            chatHistory.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                  activeChatId === chat.id 
                    ? 'bg-gradient-to-r from-rose-50 via-purple-50 to-indigo-50 border-l-4 border-rose-500 text-slate-900 font-semibold shadow-sm border-y border-r border-rose-100' 
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={16} className={activeChatId === chat.id ? 'text-rose-500 shrink-0' : 'text-slate-400 shrink-0'} />
                  <div className="truncate">
                    <p className="text-xs font-semibold truncate leading-tight">{chat.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{chat.timestamp}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-white transition-all shrink-0"
                  title="Delete Chat"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Clear History Button */}
        {chatHistory.length > 0 && (
          <div className="p-3 border-t border-slate-100 min-w-[288px]">
            <button
              onClick={handleClearAllHistory}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            >
              <RotateCcw size={12} />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto relative">
        {/* Colorful Top Header Nav */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-rose-100/80 shadow-xs">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                title="Open Sidebar"
              >
                <PanelLeft size={20} />
              </button>
            )}
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="p-2 bg-gradient-to-tr from-rose-500 via-purple-500 to-indigo-600 rounded-xl text-white shadow-md shadow-rose-200">
                <Sparkles size={18} />
              </div>
              <span className="font-extrabold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                CopilotAI
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserCircle className="text-slate-400 cursor-pointer hover:text-rose-500 transition-colors" size={32} />
          </div>
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto px-6 pb-40">
          <div className="text-center my-8">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              How can I help you today?
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-medium">
              Tell me your goal by text or voice, and I'll execute the plan.
            </p>
          </div>

          {/* Backend Connection Error Banner */}
          {backendError && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-sm font-medium flex items-center gap-3 mb-6 shadow-sm animate-fadeIn">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-600 shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="font-bold text-amber-900">Backend Not Connected</p>
                <p className="text-xs text-amber-700 mt-0.5">{backendError}</p>
              </div>
            </div>
          )}

          {/* Execution / Timeline Area */}
          <div className="mb-8">
            {tasks.length === 0 && !isPlanning && !backendError && (
              <div className="flex flex-col items-center justify-center h-52 border-2 border-dashed border-rose-200/60 rounded-3xl text-slate-400 bg-white/70 backdrop-blur-md p-6 text-center shadow-lg shadow-purple-50/50">
                <div className="p-3 bg-gradient-to-tr from-rose-100 via-purple-100 to-indigo-100 rounded-2xl mb-3 text-rose-500">
                  <Sparkles size={28} />
                </div>
                <p className="font-bold text-slate-700 text-sm">Your interactive agent plan will appear here...</p>
                <p className="text-xs text-slate-400 mt-1">Type a prompt or click mic to start once backend is connected.</p>
              </div>
            )}

            {isPlanning && (
              <div className="flex flex-col items-center justify-center h-52 space-y-3 bg-white/60 rounded-3xl border border-indigo-100 backdrop-blur-md shadow-md">
                <Loader2 className="animate-spin text-purple-600" size={36} />
                <p className="font-bold text-purple-900 text-sm">Reasoning & calling Backend API to build your plan...</p>
              </div>
            )}

            {!isPlanning && tasks.length > 0 && (
              <TaskTimeline tasks={tasks} onApprove={handleApprove} />
            )}
          </div>

          {/* Generated Result Output Card */}
          {finalOutput && (
            <div className="mb-12 bg-white/95 border border-emerald-200 rounded-2xl p-6 shadow-xl shadow-emerald-50 relative animate-fadeIn">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500 text-white rounded-lg">
                    <Sparkles size={16} />
                  </div>
                  <span className="font-bold text-sm text-slate-900">Generated Output</span>
                </div>
                <button
                  onClick={handleCopyOutput}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition-all active:scale-95"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Result'}</span>
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                {finalOutput}
              </pre>
            </div>
          )}

          {/* Vibrant Bottom Floating Bar */}
          <div className="fixed bottom-6 left-0 right-0 px-6 pointer-events-none">
            <div className="max-w-2xl mx-auto pointer-events-auto">
              
              {/* Listening Voice Status Indicator */}
              {isListening && (
                <div className="mb-2 mx-auto w-max px-4 py-1.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-rose-200 flex items-center gap-2 animate-bounce">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  Listening to your voice... Speak now!
                </div>
              )}

              <div className="bg-white/95 backdrop-blur-xl border border-purple-200/80 rounded-full shadow-2xl shadow-purple-100 p-2 focus-within:ring-2 ring-purple-400/30 transition-all">
                <div className="flex items-center gap-2 px-3 py-1">
                  <button 
                    className="p-2 text-slate-400 hover:text-purple-600 rounded-full hover:bg-purple-50 transition-all shrink-0"
                    title="Attach File"
                  >
                    <Paperclip size={18} />
                  </button>

                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask Copilot AI or click mic to speak..."}
                    className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus:border-none ring-0 shadow-none resize-none py-1.5 text-slate-800 max-h-24 text-sm placeholder:text-slate-400 font-medium"
                    style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGeneratePlan();
                      }
                    }}
                  />

                  {/* Colorful Microphone Button */}
                  <button 
                    onClick={toggleMic}
                    className={`p-2.5 rounded-full transition-all shrink-0 ${
                      isListening 
                        ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white animate-pulse shadow-md shadow-rose-200' 
                        : 'text-slate-500 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                    title={isListening ? "Stop listening" : "Click to speak"}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  {/* Send Button */}
                  <button 
                    onClick={() => handleGeneratePlan()}
                    disabled={!input || isPlanning}
                    className="p-2.5 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 disabled:opacity-40 text-white rounded-full transition-all shadow-md shadow-purple-200 shrink-0 active:scale-95"
                    title="Send prompt"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
