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
    setChatHistory(prev => [newHistoryItem, ...prev]);
    setActiveChatId(newChatId);

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
    <div className="flex h-screen w-screen bg-white text-[#222222] font-sans overflow-hidden">
      
      {/* Sidebar - Fixed flex width with shrink-0 so it NEVER squishes */}
      <aside 
        className={`bg-[#f7f7f7] border-r border-[#ebebeb] flex flex-col shrink-0 transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden border-none'
        }`}
      >
        <div className="p-4 border-b border-[#ebebeb] flex items-center justify-between min-w-[288px]">
          <div className="flex items-center gap-2 font-semibold text-sm text-[#222222]">
            <Clock size={16} className="text-[#ff385c]" />
            <span>Recent Chats</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-[#6a6a6a] hover:text-[#222222] hover:bg-[#ebebeb] rounded-full transition-colors"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 min-w-[288px]">
          <button 
            onClick={handleStartNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff385c] hover:bg-[#e00b41] text-white font-medium rounded-full text-sm transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 py-2 min-w-[288px]">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                activeChatId === chat.id 
                  ? 'bg-white text-[#222222] font-semibold shadow-sm border border-[#dddddd]' 
                  : 'hover:bg-[#ebebeb]/60 text-[#3f3f3f]'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className={activeChatId === chat.id ? 'text-[#ff385c] shrink-0' : 'text-[#929292] shrink-0'} />
                <div className="truncate">
                  <p className="text-xs font-medium truncate leading-tight">{chat.title}</p>
                  <p className="text-[10px] text-[#6a6a6a] mt-0.5">{chat.timestamp}</p>
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteChat(e, chat.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-[#6a6a6a] hover:text-[#ff385c] rounded transition-all shrink-0"
                title="Delete Chat"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto relative bg-white">
        {/* Top Header Nav */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-[#ebebeb]">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-[#222222] hover:bg-[#f7f7f7] rounded-full transition-colors"
                title="Open Sidebar"
              >
                <PanelLeft size={20} />
              </button>
            )}
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="p-1.5 bg-[#ff385c] rounded-lg text-white">
                <Sparkles size={18} />
              </div>
              <span className="text-[#222222]">Copilot<span className="text-[#ff385c]">AI</span></span>
            </div>
          </div>
          <UserCircle className="text-[#6a6a6a] cursor-pointer hover:text-[#ff385c] transition-colors" size={30} />
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto px-6 pb-40">
          <div className="text-center my-10">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-[#222222]">How can I help you today?</h1>
            <p className="text-[#6a6a6a] text-sm md:text-base">Tell me your goal by text or voice, and I'll handle the rest.</p>
          </div>

          {/* Execution / Timeline Area */}
          <div className="mb-12">
            {tasks.length === 0 && !isPlanning && (
              <div className="flex flex-col items-center justify-center h-56 border border-dashed border-[#dddddd] rounded-2xl text-[#6a6a6a] bg-[#f7f7f7]/50 p-6 text-center">
                <Sparkles size={28} className="text-[#ff385c] mb-2 opacity-80" />
                <p className="font-semibold text-[#222222] text-sm">Your agent plan will appear here...</p>
                <p className="text-xs text-[#6a6a6a] mt-1">Type a prompt or click the microphone button below to start.</p>
              </div>
            )}

            {isPlanning && (
              <div className="flex flex-col items-center justify-center h-56 space-y-3">
                <Loader2 className="animate-spin text-[#ff385c]" size={32} />
                <p className="font-semibold text-[#222222] text-sm">Reasoning and building your action plan...</p>
              </div>
            )}

            {!isPlanning && tasks.length > 0 && (
              <TaskTimeline tasks={tasks} onApprove={handleApprove} />
            )}
          </div>

          {/* Bottom Input Bar */}
          <div className="fixed bottom-6 left-0 right-0 px-6 pointer-events-none">
            <div className="max-w-2xl mx-auto pointer-events-auto">
              
              {/* Listening Voice Status Indicator */}
              {isListening && (
                <div className="mb-2 mx-auto w-max px-4 py-1.5 bg-[#ff385c] text-white text-xs font-semibold rounded-full shadow-md flex items-center gap-2 animate-bounce">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Listening to your voice... Speak now!
                </div>
              )}

              <div className="bg-white border border-[#dddddd] rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-2 focus-within:border-[#222222] transition-all">
                <div className="flex items-center gap-2 px-3 py-1">
                  <button 
                    className="p-2 text-[#6a6a6a] hover:text-[#222222] rounded-full hover:bg-[#f7f7f7] transition-all shrink-0"
                    title="Attach File"
                  >
                    <Paperclip size={18} />
                  </button>

                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask Copilot AI or click mic to speak..."}
                    className="w-full bg-transparent border-none focus:ring-0 resize-none py-1.5 text-[#222222] max-h-24 text-sm placeholder:text-[#929292] font-normal"
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
                    className={`p-2.5 rounded-full transition-all shrink-0 ${
                      isListening 
                        ? 'bg-[#ff385c] text-white animate-pulse shadow-md' 
                        : 'text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7]'
                    }`}
                    title={isListening ? "Stop listening" : "Click to speak"}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  {/* Send Button */}
                  <button 
                    onClick={() => handleGeneratePlan()}
                    disabled={!input || isPlanning}
                    className="p-2.5 bg-[#ff385c] hover:bg-[#e00b41] disabled:bg-[#ffd1da] text-white rounded-full transition-all shadow-sm shrink-0 active:scale-95"
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
