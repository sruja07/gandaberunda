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
  Zap,
  RotateCcw
} from 'lucide-react';
import { TaskStep } from '@/types/agent';
import TaskTimeline from '@/components/TaskTimeline';

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  tasks: TaskStep[];
}

const DEFAULT_HISTORY: ChatHistoryItem[] = [
  {
    id: 'chat-1',
    title: 'Plan a 3-day trip to Tokyo and book hotels',
    timestamp: 'Just now',
    tasks: [
      { step_id: '1', title: 'Analyzing your request and travel preferences', tool: 'reasoning_engine', args: {}, status: 'COMPLETED', requires_approval: false, risk_level: 'LOW', result: 'Extracted 3-day itinerary preferences' },
      { step_id: '2', title: 'Searching flights and Tokyo hotel options', tool: 'web_search', args: {}, status: 'COMPLETED', requires_approval: false, risk_level: 'LOW', result: 'Found 4 hotel recommendations near Shibuya' },
      { step_id: '3', title: 'Executing flight reservation checkout', tool: 'system_api', args: {}, status: 'REQUIRES_APPROVAL', requires_approval: true, risk_level: 'HIGH' },
      { step_id: '4', title: 'Generating final itinerary summary', tool: 'summarizer', args: {}, status: 'PENDING', requires_approval: false, risk_level: 'LOW' },
    ]
  },
  {
    id: 'chat-2',
    title: 'Deploy Express backend to Vercel serverless',
    timestamp: '2 hours ago',
    tasks: [
      { step_id: '1', title: 'Building production bundle and checking routes', tool: 'compiler', args: {}, status: 'COMPLETED', requires_approval: false, risk_level: 'LOW', result: 'Build passed cleanly' },
      { step_id: '2', title: 'Configuring Vercel deployment credentials', tool: 'cli_tool', args: {}, status: 'COMPLETED', requires_approval: false, risk_level: 'LOW', result: 'Deployment live on vercel.app' }
    ]
  },
  {
    id: 'chat-3',
    title: 'Analyze Q3 revenue and sales growth metrics',
    timestamp: 'Yesterday',
    tasks: [
      { step_id: '1', title: 'Querying PostgreSQL analytics database', tool: 'db_client', args: {}, status: 'COMPLETED', requires_approval: false, risk_level: 'LOW', result: 'Fetched 14,200 transaction rows' },
      { step_id: '2', title: 'Generating revenue breakdown chart', tool: 'chart_engine', args: {}, status: 'COMPLETED', requires_approval: false, risk_level: 'LOW', result: 'Growth up 24% YoY' }
    ]
  }
];

export default function CopilotPage() {
  const [input, setInput] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [tasks, setTasks] = useState<TaskStep[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>(DEFAULT_HISTORY);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Load chat history from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('copilot_chat_history');
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChatHistory(parsed);
          }
        } catch (e) {
          console.error('Failed to parse chat history from localStorage:', e);
        }
      }
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && chatHistory.length > 0) {
      localStorage.setItem('copilot_chat_history', JSON.stringify(chatHistory));
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
      "Plan a 3-day trip to Tokyo and book the hotels",
      "Deploy the Express backend to production server",
      "Summarize customer feedback from recent support tickets"
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
    }, 50);
  };

  const handleStartNewChat = () => {
    setActiveChatId(null);
    setInput("");
    setTasks([]);
  };

  const handleSelectChat = (chat: ChatHistoryItem) => {
    setActiveChatId(chat.id);
    setInput(chat.title);
    setTasks(chat.tasks);
  };

  const handleDeleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = chatHistory.filter(item => item.id !== id);
    setChatHistory(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('copilot_chat_history', JSON.stringify(updated));
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

    await new Promise(r => setTimeout(r, 1200));

    const mockPlan: TaskStep[] = [
      { step_id: '1', title: `Analyzing request: "${textToUse}"`, tool: 'reasoning_engine', args: {}, status: 'PENDING', requires_approval: false, risk_level: 'LOW' },
      { step_id: '2', title: 'Searching relevant documents & APIs', tool: 'web_search', args: {}, status: 'PENDING', requires_approval: false, risk_level: 'LOW' },
      { step_id: '3', title: 'Executing system & database action', tool: 'system_api', args: {}, status: 'PENDING', requires_approval: true, risk_level: 'HIGH' },
      { step_id: '4', title: 'Generating final response and report', tool: 'summarizer', args: {}, status: 'PENDING', requires_approval: false, risk_level: 'LOW' },
    ];
    
    setTasks(mockPlan);
    setIsPlanning(false);

    const newChatId = `chat-${Date.now()}`;
    const newHistoryItem: ChatHistoryItem = {
      id: newChatId,
      title: textToUse,
      timestamp: 'Just now',
      tasks: mockPlan
    };

    const updatedHistory = [newHistoryItem, ...chatHistory];
    setChatHistory(updatedHistory);
    setActiveChatId(newChatId);

    if (typeof window !== 'undefined') {
      localStorage.setItem('copilot_chat_history', JSON.stringify(updatedHistory));
    }

    for (let i = 0; i < mockPlan.length; i++) {
      const id = mockPlan[i].step_id;
      setTasks(prev => prev.map(t => t.step_id === id ? { ...t, status: 'IN_PROGRESS' } : t));
      
      await new Promise(r => setTimeout(r, 1800));

      if (mockPlan[i].requires_approval) {
        setTasks(prev => prev.map(t => t.step_id === id ? { ...t, status: 'REQUIRES_APPROVAL' } : t));
        return;
      }
      
      setTasks(prev => prev.map(t => t.step_id === id ? { ...t, status: 'COMPLETED', result: 'Completed successfully' } : t));
    }
  };

  const handleApprove = (id: string) => {
    setTasks(prev => prev.map(t => t.step_id === id ? { ...t, status: 'COMPLETED', result: 'Approved by user' } : t));
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

        {/* Vibrant Gradient New Chat Button */}
        <div className="p-4 min-w-[288px]">
          <button 
            onClick={handleStartNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-semibold rounded-full text-sm transition-all shadow-md shadow-purple-200 active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History List with LocalStorage Persistence */}
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
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs flex items-center gap-1">
              <Zap size={12} /> PRO
            </span>
            <UserCircle className="text-slate-400 cursor-pointer hover:text-rose-500 transition-colors" size={32} />
          </div>
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto px-6 pb-40">
          <div className="text-center my-10">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              How can I help you today?
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-medium">
              Tell me your goal by text or voice, and I'll execute the plan.
            </p>
          </div>

          {/* Execution / Timeline Area */}
          <div className="mb-12">
            {tasks.length === 0 && !isPlanning && (
              <div className="flex flex-col items-center justify-center h-56 border-2 border-dashed border-rose-200/60 rounded-3xl text-slate-400 bg-white/70 backdrop-blur-md p-6 text-center shadow-lg shadow-purple-50/50">
                <div className="p-3 bg-gradient-to-tr from-rose-100 via-purple-100 to-indigo-100 rounded-2xl mb-3 text-rose-500">
                  <Sparkles size={28} />
                </div>
                <p className="font-bold text-slate-700 text-sm">Your interactive agent plan will appear here...</p>
                <p className="text-xs text-slate-400 mt-1">Type a prompt or click the colorful mic button below to start.</p>
              </div>
            )}

            {isPlanning && (
              <div className="flex flex-col items-center justify-center h-56 space-y-3 bg-white/60 rounded-3xl border border-indigo-100 backdrop-blur-md shadow-md">
                <Loader2 className="animate-spin text-purple-600" size={36} />
                <p className="font-bold text-purple-900 text-sm">Reasoning & building your multi-step action plan...</p>
              </div>
            )}

            {!isPlanning && tasks.length > 0 && (
              <TaskTimeline tasks={tasks} onApprove={handleApprove} />
            )}
          </div>

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
                    className="w-full bg-transparent border-none focus:ring-0 resize-none py-1.5 text-slate-800 max-h-24 text-sm placeholder:text-slate-400 font-medium"
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

                  {/* Vibrant Gradient Send Button */}
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
