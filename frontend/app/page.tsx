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
  User,
  Bot
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessage[];
}

export default function CopilotPage() {
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Load saved history from localStorage
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

  // Save history to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && chatHistory.length > 0) {
      localStorage.setItem('copilot_chat_history', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

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
      "Write an email seeking leave for 2 days",
      "Plan a 3-day trip to Tokyo and book hotels",
      "Deploy Express backend to production server"
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
    setActiveMessages([]);
  };

  const handleSelectChat = (chat: ChatHistoryItem) => {
    setActiveChatId(chat.id);
    setInput("");
    setActiveMessages(chat.messages || []);
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

  const handleSendMessage = async () => {
    const promptText = input.trim();
    if (!promptText) return;
    setIsSubmitting(true);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let updatedMessages = [...activeMessages, userMessage];
    setActiveMessages(updatedMessages);
    setInput("");

    // Save user prompt to sidebar history
    let currentChatId = activeChatId;
    if (!currentChatId) {
      currentChatId = `chat-${Date.now()}`;
      setActiveChatId(currentChatId);
      const newHistoryItem: ChatHistoryItem = {
        id: currentChatId,
        title: promptText,
        timestamp: 'Just now',
        messages: updatedMessages
      };
      setChatHistory(prev => [newHistoryItem, ...prev]);
    } else {
      setChatHistory(prev => prev.map(chat => 
        chat.id === currentChatId ? { ...chat, messages: updatedMessages } : chat
      ));
    }

    // Connect to Backend API when backend service is live & ready
    try {
      const res = await fetch('http://localhost:5000/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.outputContent) {
          const botMessage: ChatMessage = {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            text: data.outputContent,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          updatedMessages = [...updatedMessages, botMessage];
          setActiveMessages(updatedMessages);
          setChatHistory(prev => prev.map(chat => 
            chat.id === currentChatId ? { ...chat, messages: updatedMessages } : chat
          ));
        }
      }
    } catch (e) {
      console.log('Backend API connection pending or offline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-rose-50/60 via-slate-50 to-indigo-50/60 text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar - Recent Chat History */}
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
              No recent chats. Start a new prompt!
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
        {/* Top Header Nav */}
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

        <main className="flex-1 max-w-3xl w-full mx-auto px-6 pb-40 flex flex-col">
          <div className="text-center my-6">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              How can I help you today?
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-medium">
              Frontend Interface — Connected to Backend API
            </p>
          </div>

          {/* Messages Display Area */}
          <div className="flex-1 space-y-4 mb-8">
            {activeMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-52 border-2 border-dashed border-rose-200/60 rounded-3xl text-slate-400 bg-white/70 backdrop-blur-md p-6 text-center shadow-lg shadow-purple-50/50">
                <div className="p-3 bg-gradient-to-tr from-rose-100 via-purple-100 to-indigo-100 rounded-2xl mb-3 text-rose-500">
                  <Sparkles size={28} />
                </div>
                <p className="font-bold text-slate-700 text-sm">Start a conversation...</p>
                <p className="text-xs text-slate-400 mt-1">Type your prompt or use the voice microphone below.</p>
              </div>
            )}

            {activeMessages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {msg.sender === 'user' ? (
                  <div className="flex items-start justify-end gap-3">
                    <div className="bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-600 text-white p-4 rounded-2xl max-w-lg shadow-md">
                      <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                      <span className="text-[10px] text-white/70 block text-right mt-1">{msg.timestamp}</span>
                    </div>
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-full shrink-0">
                      <User size={18} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-tr from-rose-500 to-purple-600 text-white rounded-full shrink-0">
                      <Bot size={18} />
                    </div>
                    <div className="bg-white/95 border border-purple-100 p-5 rounded-2xl max-w-lg shadow-sm">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed">
                        {msg.text}
                      </pre>
                      <span className="text-[10px] text-slate-400 block text-right mt-2">{msg.timestamp}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Input Bar */}
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
                    className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none ring-0 border-0 shadow-none resize-none py-1.5 text-slate-800 max-h-24 text-sm placeholder:text-slate-400 font-medium"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
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
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isSubmitting}
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
