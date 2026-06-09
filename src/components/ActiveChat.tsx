import { useState, useRef, useEffect } from "react";
import { Paper, ChatMessage } from "../types";
import { MessageSquare, Send, X, RefreshCw, Sparkles, BookOpen, User, Bot, HelpCircle } from "lucide-react";

interface ActiveChatProps {
  paper: Paper;
  onClose: () => void;
}

const CHAT_SUGGESTIONS = [
  "Explain the core mathematical equations or neural mechanisms.",
  "What baselines do the authors compare against, and are they fair?",
  "How could I implement or write code for this methodology?",
  "What is the intuitive 'secret sauce' that makes this approach work?"
];

export default function ActiveChat({ paper, onClose }: ActiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Load welcome state
  useEffect(() => {
    setMessages([
      {
        role: "model",
        text: `Hello! I am your AI Active Reading Partner for **"${paper.title}"**. 

I can help you deep-dive into this paper's details. You can ask me to expand on its mathematical proofs, translate concepts to simple terms, explain the datasets used, or code a miniature mock model of this approach.

What specific aspect of the study can we dissect together?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [paper.id]);

  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      role: "user",
      text: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsGenerating(true);
    setErrorState(null);

    try {
      // Map existing messages to correct Gemini format
      // filter out the initial greetings if we want, or map all
      const apiHistory = messages.slice(1).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperSummary: paper,
          message: msgText,
          history: apiHistory,
        }),
      });

      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || "Failed to generate chat response.");
      }

      const data = await res.json();

      const modelMsg: ChatMessage = {
        role: "model",
        text: data.response || "No response received.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorState(err.message || "An error occurred while connecting. Let's try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="active-chat-drawer" className="flex flex-col h-full bg-[#0F1115] border-l border-white/10">
      {/* Active Chat Header */}
      <div className="p-4 bg-[#16191E] border-b border-white/5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-left">
          <Bot className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-xs font-semibold text-slate-200">Active Reading Partner</h3>
            <p className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">
              Discussion: {paper.title}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 px-2 text-slate-500 hover:text-slate-300 rounded hover:bg-white/5 text-xs font-mono font-bold"
          title="Close chatbot"
        >
          [hide]
        </button>
      </div>

      {/* Messages Thread list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isModel = msg.role === "model";
          return (
            <div
              key={index}
              className={`flex gap-2.5 max-w-[85%] text-left ${isModel ? "mr-auto" : "ml-auto flex-row-reverse"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm ${
                  isModel ? "bg-indigo-600" : "bg-slate-700"
                }`}
              >
                {isModel ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div className="space-y-1">
                <div
                  className={`px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                    isModel
                      ? "bg-[#16191E] text-slate-200 border border-white/5 shadow-sm"
                      : "bg-indigo-600 text-white shadow"
                  }`}
                >
                  <pre className="font-sans whitespace-pre-wrap break-words">{msg.text}</pre>
                </div>
                <div className={`text-[9px] text-slate-500 px-1 font-mono ${isModel ? "text-left" : "text-right"}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex gap-2.5 max-w-[85%] text-left mr-auto">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white animate-pulse">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="px-3.5 py-2.5 bg-[#16191E] border border-white/5 shadow-sm rounded-xl text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Formulating response from PDF context...</span>
            </div>
          </div>
        )}

        {errorState && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl text-left flex flex-col gap-2 shadow-sm font-sans">
            <p>{errorState}</p>
            <button
              onClick={() => {
                const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
                if (lastUserMsg) {
                  handleSendMessage(lastUserMsg.text);
                }
              }}
              className="text-[10px] font-bold text-rose-400 uppercase text-left hover:underline"
            >
              Retry Connection
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Inquiries inside Footer */}
      {messages.length <= 1 && !isGenerating && (
        <div className="p-3 bg-indigo-500/5 border-t border-white/5">
          <p className="text-[9px] font-bold tracking-wider font-mono text-indigo-400 uppercase mb-2 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Quick Dissections
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {CHAT_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                className="p-2 px-3 bg-[#16191E] hover:bg-white/5 hover:text-white border border-white/5 text-left text-[10px] text-slate-400 rounded-lg transition-all truncate group"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Chat Input Footer */}
      <div className="p-3 bg-[#16191E] border-t border-white/10 flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask partner to expand or explain (e.g. math)..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage(inputMessage);
          }}
          disabled={isGenerating}
          className="flex-1 px-3 py-2 text-xs border border-white/10 focus:border-indigo-500 focus:outline-none bg-[#1A1D23] text-slate-200 rounded-lg placeholder:text-slate-500"
        />
        <button
          onClick={() => handleSendMessage(inputMessage)}
          disabled={!inputMessage.trim() || isGenerating}
          className="p-2 bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg disabled:opacity-40 transition-colors"
          title="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
