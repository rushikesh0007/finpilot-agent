import React, { useState } from "react";
import { Send, Bot, User, ChevronDown, ChevronUp, Cpu, Database, CheckCircle2, AlertTriangle, Sparkles, Terminal } from "lucide-react";
import { ChatMessage, AuditTrace } from "../types";

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
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

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

  const toggleTrace = (id: string) => {
    setExpandedTraceId((prev) => (prev === id ? null : id));
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
          Grounded in verified math
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
          const isTraceOpen = expandedTraceId === msg.id;

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
                    <div className="whitespace-pre-wrap font-normal">
                      {msg.content}
                    </div>
                  </div>

                  {/* Clean Collapsed Math Breakdown (Closed by default) */}
                  {isAssistant && msg.trace && (
                    <div className="pt-0.5">
                      <button
                        onClick={() => toggleTrace(msg.id)}
                        className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-md transition-colors"
                        title="Click to view underlying calculation details"
                      >
                        <span>⚙️ View math breakdown</span>
                        {isTraceOpen ? (
                          <ChevronUp className="w-3 h-3 text-slate-600" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-slate-600" />
                        )}
                      </button>

                      {isTraceOpen && (
                        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3.5 space-y-3 text-xs shadow-xs max-w-2xl">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                              <span>
                                {msg.trace.tool_invocation.tool === "simulate_purchase"
                                  ? "Purchase Affordability Check"
                                  : msg.trace.tool_invocation.tool === "detect_recurring_and_subscriptions"
                                  ? "Subscription & Bill Scan"
                                  : msg.trace.tool_invocation.tool === "detect_anomalies"
                                  ? "Unusual Charges Scan"
                                  : msg.trace.tool_invocation.tool === "compare_budgets"
                                  ? "Budget Pace Check"
                                  : msg.trace.tool_invocation.tool === "generate_executive_report"
                                  ? "Monthly Money Summary"
                                  : msg.trace.tool_invocation.tool === "calculate_opportunity_cost"
                                  ? "Savings Goal Impact"
                                  : "Financial Health Check"}
                              </span>
                            </span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                              Verified
                            </span>
                          </div>

                          {/* Computed Financial Numbers */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                              Verified Numbers:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                              {Object.entries(msg.trace.mathematical_observation || {})
                                .filter(([_, val]) => typeof val === "number" || typeof val === "string")
                                .slice(0, 6)
                                .map(([key, val]) => (
                                  <div key={key} className="p-2 rounded bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] text-slate-500 font-medium block truncate">
                                      {key.replace(/_/g, " ").replace(/pct/g, "%").toUpperCase()}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                                      {typeof val === "number"
                                        ? key.includes("pct") || key.includes("rate")
                                          ? `${val}%`
                                          : `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : String(val).replace(/BREACHED/g, "OVER BUDGET").replace(/BREACH_PROJECTED/g, "OVER BUDGET SOON")}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center space-x-1 pt-1 border-t border-slate-100">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>All calculations computed behind the scenes with exact math.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
              <span className="text-slate-500">FinPilot is crunching the numbers...</span>
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
