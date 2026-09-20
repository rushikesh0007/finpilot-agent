import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { MetricCards } from "./components/MetricCards";
import { DecisionCockpit } from "./components/DecisionCockpit";
import { AffordabilitySimulator } from "./components/AffordabilitySimulator";
import { DynamicBudgetsView } from "./components/DynamicBudgetsView";
import { SubscriptionBleedView } from "./components/SubscriptionBleedView";
import { AnomaliesView } from "./components/AnomaliesView";
import { LifeValueTranslatorView } from "./components/LifeValueTranslatorView";
import { ExecutiveReportModal } from "./components/ExecutiveReportModal";
import { IngestModal } from "./components/IngestModal";
import {
  MonthlySummary,
  BudgetComparison,
  RecurringAnalysis,
  AnomalyReport,
  OpportunityCostResult,
  ExecutiveReport,
  ChatMessage,
  SimulationResult
} from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [overviewSubView, setOverviewSubView] = useState<"chat" | "simulator">("chat");
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // Core Financial Datasets
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [budgets, setBudgets] = useState<BudgetComparison | null>(null);
  const [recurring, setRecurring] = useState<RecurringAnalysis | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyReport | null>(null);
  const [opportunity, setOpportunity] = useState<OpportunityCostResult | null>(null);
  const [executiveReport, setExecutiveReport] = useState<ExecutiveReport | null>(null);

  // Modals
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isIngestOpen, setIsIngestOpen] = useState(false);

  // Chat State with Initial Transparent Audit Trace
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      role: "assistant",
      content:
        "Hi! I'm FinPilot, your personal finance companion. I'm here to help you make confident decisions with your money—whether you're wondering if you can afford a new purchase, tracking down sneaky subscription price hikes, or checking your monthly budgets.\n\nWhat would you like to explore today? Feel free to ask a question or tap one of the suggested prompts above!",
      timestamp: "Aug 19, 2026 • 09:00 AM",
      trace: {
        query: "Initial Financial Health Check",
        thought_process:
          "Loaded August 2026 transactions. User has $3,450.00 liquid balance against $1,000.00 emergency cushion.",
        tool_invocation: {
          tool: "get_monthly_summary",
          parameters: { month: 8, year: 2026 }
        },
        mathematical_observation: {
          period: "2026-08",
          total_income: 6500.0,
          total_expenses: 4249.08,
          net_savings: 2250.92,
          savings_rate_pct: 34.6,
          current_liquid_balance: 3450.0,
          safety_buffer_minimum: 1000.0,
          buffer_headroom: 2450.0
        },
        synthesized_recommendation:
          "Baseline ready: You maintain $2,450 in safe cushion above your $1,000 emergency floor with a 34.6% savings rate."
      }
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Fetch all deterministic metrics from the backend engine
  const loadFinancialData = async () => {
    try {
      const [sumRes, budRes, recRes, anomRes, oppRes, repRes] = await Promise.all([
        fetch("/api/finance/summary"),
        fetch("/api/finance/budgets"),
        fetch("/api/finance/recurring"),
        fetch("/api/finance/anomalies"),
        fetch("/api/finance/opportunity"),
        fetch("/api/finance/report")
      ]);

      const [sumData, budData, recData, anomData, oppData, repData] = await Promise.all([
        sumRes.json(),
        budRes.json(),
        recRes.json(),
        anomRes.json(),
        oppRes.json(),
        repRes.json()
      ]);

      setSummary(sumData);
      setBudgets(budData);
      setRecurring(recData);
      setAnomalies(anomData);
      setOpportunity(oppData);
      setExecutiveReport(repData);
    } catch (err) {
      console.error("Failed to load baseline financial data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await fetch("/api/finance/reset", { method: "POST" });
      await loadFinancialData();
      const resetMsg: ChatMessage = {
        id: "reset-" + Date.now(),
        role: "assistant",
        content: "Reset to **August 2026** baseline dataset. All metrics, categories, and safety buffer calculations are now restored to default sample data.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, resetMsg]);
    } finally {
      setIsResetting(false);
    }
  };

  const handleIngestSuccess = async (data: {
    filename: string;
    count: number;
    periodLabel: string;
    summary: MonthlySummary;
  }) => {
    await loadFinancialData();

    // Add confirmation note in the chat as required
    const confirmationMsg: ChatMessage = {
      id: "ingest-confirm-" + Date.now(),
      role: "assistant",
      content: `Loaded **${data.filename}** with **${data.count} transactions** (${data.periodLabel}). What would you like to analyze?\n\n• **Money In**: $${data.summary.total_income.toLocaleString("en-US", { minimumFractionDigits: 2 })}\n• **Money Spent**: $${data.summary.total_expenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}\n• **Leftover Cash**: $${data.summary.net_savings.toLocaleString("en-US", { minimumFractionDigits: 2 })}\n• **Emergency Cushion**: +$${data.summary.buffer_headroom.toLocaleString("en-US", { minimumFractionDigits: 2 })} above safety floor`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      trace: {
        query: `Statement Ingestion (${data.filename})`,
        thought_process: `Re-initialized active statement to ${data.periodLabel} with ${data.count} verified transactions. All downstream tools (budgeting, anomaly detection, affordability simulation) will now operate against this fresh baseline dataset.`,
        tool_invocation: {
          tool: "get_monthly_summary",
          parameters: { filename: data.filename, count: data.count }
        },
        mathematical_observation: data.summary,
        synthesized_recommendation: `Successfully updated financial baseline to ${data.periodLabel}. All 4 top metrics and dashboard views have been recomputed.`
      }
    };

    setMessages((prev) => [...prev, confirmationMsg]);
  };

  // Chat message sender
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      content: text,
      timestamp: "Aug 19, 2026 • " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/finance/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: "asst-" + Date.now(),
        role: "assistant",
        content: data.synthesized_recommendation,
        timestamp: "Aug 19, 2026 • " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        trace: {
          query: data.query,
          thought_process: data.thought_process,
          tool_invocation: data.tool_invocation,
          mathematical_observation: data.mathematical_observation,
          synthesized_recommendation: data.synthesized_recommendation
        }
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: "Sorry, an error occurred while calculating your financial numbers. Please try again.",
        timestamp: "Aug 19, 2026 • " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Counterfactual Simulator action
  const handleSimulate = async (
    itemName: string,
    cost: number,
    isRecurring: boolean,
    monthlyEmi: number,
    goalTarget: string
  ): Promise<SimulationResult> => {
    const res = await fetch("/api/finance/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_name: itemName,
        cost,
        is_recurring: isRecurring,
        monthly_emi: monthlyEmi,
        target_goal_name: goalTarget
      })
    });
    return await res.json();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      {/* Navigation & Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenIngest={() => setIsIngestOpen(true)}
        onReset={handleReset}
        isResetting={isResetting}
        periodLabel={summary?.period_label || "August 2026"}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Executive Metric Cards (Always visible as grounding anchor) */}
        <MetricCards summary={summary} loading={loading} />

        {/* Tabbed Viewport */}
        <div className="mt-2">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-2.5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-600">
                  Overview Mode:
                </span>
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setOverviewSubView("chat")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      overviewSubView === "chat"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    💬 Chat Assistant
                  </button>
                  <button
                    onClick={() => setOverviewSubView("simulator")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      overviewSubView === "simulator"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🛍️ "Can I Afford It?" Calculator
                  </button>
                </div>
              </div>

              {overviewSubView === "chat" ? (
                <DecisionCockpit
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isChatLoading}
                  onSelectPrompt={handleSendMessage}
                />
              ) : (
                <AffordabilitySimulator onSimulate={handleSimulate} />
              )}
            </div>
          )}

          {activeTab === "budgets" && (
            <DynamicBudgetsView budgets={budgets} loading={loading} />
          )}

          {activeTab === "subscriptions" && (
            <SubscriptionBleedView recurring={recurring} loading={loading} />
          )}

          {activeTab === "anomalies" && (
            <AnomaliesView anomalies={anomalies} loading={loading} />
          )}

          {activeTab === "goals" && (
            <LifeValueTranslatorView opportunity={opportunity} loading={loading} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">FinPilot</span>
            <span>• Built for AI Agent Hackathon 2026</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Smart, private, and mathematically verified personal finance assistant
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExecutiveReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={executiveReport}
        loading={loading}
      />

      <IngestModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onIngestSuccess={handleIngestSuccess}
      />
    </div>
  );
}
