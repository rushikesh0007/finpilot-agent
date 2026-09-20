import React from "react";
import { Compass, FileText, Upload, RefreshCw } from "lucide-react";

interface HeaderProps {
  onOpenReport: () => void;
  onOpenIngest: () => void;
  onReset: () => void;
  isResetting: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  periodLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenReport,
  onOpenIngest,
  onReset,
  isResetting,
  activeTab,
  setActiveTab,
  periodLabel = "August 2026"
}) => {
  const tabs = [
    { id: "overview", label: "Overview & Chat" },
    { id: "budgets", label: "Budget Tracker" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "anomalies", label: "Unusual Charges" },
    { id: "goals", label: "Goal Impact" }
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">FinPilot</span>
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Financial Companion
                </span>
                <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 hidden sm:inline-block">
                  {periodLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Everyday personal finance decision assistant</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenReport}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
              title="View Monthly Summary Report"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Monthly Report</span>
            </button>

            <button
              onClick={onOpenIngest}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Import Bank or Credit Card Statement"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Import Statement</span>
            </button>

            <button
              onClick={onReset}
              disabled={isResetting}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Reset to Sample Data"
            >
              <RefreshCw className={`w-4 h-4 ${isResetting ? "animate-spin text-slate-700" : ""}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
