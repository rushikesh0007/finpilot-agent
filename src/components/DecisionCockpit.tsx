import React, { useState } from "react";
import Markdown from "react-markdown";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { ChatMessage } from "../types";

interface DecisionCockpitProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onSelectPrompt: (prompt: string) => void;
}

export const DecisionCockpit: React.FC<DecisionCockpitProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onSelectPrompt
}) => {
  const [inputText, setInputText] = useState("");

  const predefinedPrompts = [
    { label: "Can I buy a $750 laptop?", query: "Can I buy a $750 laptop?" },
    { label: "Which subscriptions increased?", query: "Which subscriptions increased?" },
    { label: "Any duplicate or weird charges?", query: "Detect anomalies & duplicate charges" },
    { label: "How is my dining out budget?", query: "What is my spending velocity on Dining Out?" },
    { label: "Can I afford an $80/mo gym?", query: "Can I take on an $80/month EMI?" },
    { label: "Where can I trim expenses?", query: "Audit my top financial leaks" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText("");
    onSendMessage(text);
  };

  return (
    <div className="flex flex-col h-[740px] bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            FinPilot Decision Assistant
          </span>
        </div>
        <div className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
          Smart Personal Finance Companion
        </div>
      </div>

      {/* Predefined Trigger Chips */}
      <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-xs font-semibold text-slate-400 pl-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-500" /> Ideas:
        </span>
        {predefinedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(p.query)}
            disabled={isLoading}
            className="text-xs font-medium px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors whitespace-nowrap shadow-2xs hover:border-slate-300 disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.map((msg) => {
          const isAssistant = msg.role === "assistant";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAssistant ? "items-start" : "items-end"}`}
            >
              <div className="flex items-start gap-2.5 max-w-3xl">
                {isAssistant && (
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <div
                    className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      isAssistant
                        ? "bg-slate-50 border border-slate-200 text-slate-900"
                        : "bg-slate-900 text-white shadow-xs"
                    }`}
                  >
                    {isAssistant ? (
                      <div className="prose prose-sm prose-slate max-w-none leading-relaxed space-y-2">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap font-normal">
                        {msg.content}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 px-1">
                    {msg.timestamp}
                  </div>
                </div>

                {!isAssistant && (
                  <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-slate-500">FinPilot is calculating the numbers...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask FinPilot a decision question (e.g., 'Can I buy an $850 laptop?', 'Audit my subscriptions')..."
            className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-medium text-sm flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
