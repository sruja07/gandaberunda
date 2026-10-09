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
  Clock 
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

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
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
          // Fallback simulation if Speech API fails or is restricted in environment
          simulateSpeechInput();
        }
      } else {
        // Fallback simulation for unsupported browsers
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
    setChatHistory(prev => prev.filter(item => item.id !== id));
    if (activeChatId === id) {
      handleStartNewChat();
    }
  };

  const handleGeneratePlan = async (queryInput?: string) => {
    const textToUse = queryInput || input;
    if (!textToUse) return;
    setIsPlanning(true);
    setTasks([]);

    // 1. Simulated Reasoning Delay
    await new Promise(r => setTimeout(r, 1200));

    const mockPlan: TaskStep[] = [
      { step_id: '1', title: `Analyzing request: "${textToUse}"`, tool: 'reasoning_engine', args: {}, status: 'PENDING', requires_approval: false, risk_level: 'LOW' },
      { step_id: '2', title: 'Searching relevant documents & APIs', tool: 'web_search', args: {}, status: 'PENDING', requires_approval: false, risk_level: 'LOW' },
      { step_id: '3', title: 'Executing system & database action', tool: 'system_api', args: {}, status: 'PENDING', requires_approval: true, risk_level: 'HIGH' },
      { step_id: '4', title: 'Generating final response and report', tool: 'summarizer', args: {}, status: 'PENDING', requires_approval: false, risk_level: 'LOW' },
    ];
    
    setTasks(mockPlan);
    setIsPlanning(false);

    // Save to chat history
    const newChatId = `chat-${Date.now()}`;
    const newHistoryItem: ChatHistoryItem = {
      id: newChatId,
      title: textToUse,
      timestamp: 'Just now',
      tasks: mockPlan
    };
    setChatHistory(prev => [newHistoryItem, ...prev]);
    setActiveChatId(newChatId);

    // 2. Execute steps automatically
    for (let i = 0; i < mockPlan.length; i++) {
      const id = mockPlan[i].step_id;
      setTasks(prev => prev.map(t => t.step_id === id ? { ...t, status: 'IN_PROGRESS' } : t));
      
      await new Promise(r => setTimeout(r, 1800));

      if (mockPlan[i].requires_approval) {
        setTasks(prev => prev.map(t => t.step_id === id ? { ...t, status: 'REQUIRES_APPROVAL' } : t));
        return; // Halt until approved
      }
      
      setTasks(prev => prev.map(t => t.step_id === id ? { ...t, status: 'COMPLETED', result: 'Completed successfully' } : t));
    }
  };

  const handleApprove = (id: string) => {
    setTasks(prev => prev.map(t => t.step_id === id ? { ...t, status: 'COMPLETED', result: 'Approved by user' } : t));
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 overflow-hidden">
      
      {/* Sidebar - Recent Chat History */}
      <aside 
        className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-80' : 'w-0 -translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
            <Clock size={18} className="text-blue-600" />
            <span>Recent Chats</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button 
            onClick={handleStartNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm shadow-blue-200 active:scale-95"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 py-2">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                activeChatId === chat.id 
                  ? 'bg-blue-50 text-blue-700 font-medium border border-blue-100' 
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className={activeChatId === chat.id ? 'text-blue-600 shrink-0' : 'text-slate-400 shrink-0'} />
                <div className="truncate">
                  <p className="text-sm truncate">{chat.title}</p>
                  <p className="text-[11px] text-slate-400">{chat.timestamp}</p>
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteChat(e, chat.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-all"
                title="Delete Chat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
        {/* Navbar */}
        <header className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-200/50">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
              title="Toggle Sidebar"
            >
              {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
            </button>
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-sm">
                <Sparkles size={18} />
              </div>
              <span>Copilot<span className="text-blue-600">AI</span></span>
            </div>
          </div>
          <UserCircle className="text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" size={30} />
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto px-6 pb-40">
          <div className="text-center my-12">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">How can I help you today?</h1>
            <p className="text-slate-500 text-base md:text-lg">Tell me your goal by text or voice, and I'll handle the rest.</p>
          </div>

          {/* Execution / Timeline Area */}
          <div className="mb-12">
            {tasks.length === 0 && !isPlanning && (
              <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-white/60 p-6 text-center">
                <Sparkles size={32} className="text-slate-300 mb-2" />
                <p className="font-medium text-slate-500">Your agent plan will appear here...</p>
                <p className="text-xs text-slate-400 mt-1">Try typing a prompt or clicking the microphone icon below.</p>
              </div>
            )}

            {isPlanning && (
              <div className="flex flex-col items-center justify-center h-60 space-y-4">
                <Loader2 className="animate-spin text-blue-600" size={36} />
                <p className="font-semibold text-slate-700">Reasoning and building your action plan...</p>
              </div>
            )}

            {!isPlanning && tasks.length > 0 && (
              <TaskTimeline tasks={tasks} onApprove={handleApprove} />
            )}
          </div>

          {/* Bottom Floating Bar with Voice & Input */}
          <div className="fixed bottom-6 left-0 right-0 px-6 pointer-events-none">
            <div className="max-w-3xl mx-auto pointer-events-auto">
              
              {/* Listening Voice Status Indicator */}
              {isListening && (
                <div className="mb-2 mx-auto w-max px-4 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-2 animate-bounce">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Listening to your voice... Speak now!
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-2 focus-within:ring-2 ring-blue-500/20 transition-all">
                <div className="flex items-center gap-2 p-1">
                  <button 
                    className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-slate-50 transition-all"
                    title="Attach File"
                  >
                    <Paperclip size={20} />
                  </button>

                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask Copilot AI or click mic to speak..."}
                    className="w-full bg-transparent border-none focus:ring-0 resize-none py-2 text-slate-900 max-h-32 text-sm md:text-base placeholder:text-slate-400"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGeneratePlan();
                      }
                    }}
                  />

                  {/* Microphone Button */}
                  <button 
                    onClick={toggleMic}
                    className={`p-2.5 rounded-xl transition-all ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-200' 
                        : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
                    }`}
                    title={isListening ? "Stop listening" : "Click to speak"}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>

                  {/* Send Button */}
                  <button 
                    onClick={() => handleGeneratePlan()}
                    disabled={!input || isPlanning}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-all shadow-md shadow-blue-200 shrink-0 active:scale-95"
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
