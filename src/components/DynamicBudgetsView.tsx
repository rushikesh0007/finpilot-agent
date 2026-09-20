import React, { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, TrendingUp, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { BudgetComparison } from "../types";

interface DynamicBudgetsViewProps {
  budgets: BudgetComparison | null;
  loading: boolean;
}

export const DynamicBudgetsView: React.FC<DynamicBudgetsViewProps> = ({ budgets, loading }) => {
  const [expandedMathCategory, setExpandedMathCategory] = useState<string | null>(null);

  if (loading || !budgets) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const getStatusBadge = (status: string, runoutDay: number | null) => {
    switch (status) {
      case "OVER_BUDGET":
      case "BREACHED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Over Budget</span>
          </span>
        );
      case "RUNS_OUT_SOON":
      case "BREACH_PROJECTED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Runs Out Day {runoutDay}</span>
          </span>
        );
      case "WATCH":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span>Close to Limit</span>
          </span>
        );
      case "HEALTHY":
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Looking Good</span>
          </span>
        );
    }
  };

  const getProgressBarColor = (status: string) => {
    if (status === "OVER_BUDGET" || status === "BREACHED") return "bg-rose-500";
    if (status === "RUNS_OUT_SOON" || status === "BREACH_PROJECTED" || status === "WATCH") return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-6">
      {/* Top Velocity Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Budget Tracker & Spending Pace</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              See how much you have spent this month and whether your daily pace keeps you on track.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500">Day in month: </span>
              <span className="font-bold text-slate-900">Day {budgets.days_elapsed} of {budgets.days_in_month}</span>
            </div>
            <span className="text-slate-300">•</span>
            <div>
              <span className="text-slate-500">Total used: </span>
              <span className="font-bold text-slate-900">{budgets.overall_consumed_pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.categories.map((cat) => {
          const progressPercent = Math.min(cat.consumed_pct, 100);
          const isOverburn = cat.velocity_pct > 100;
          const isMathOpen = expandedMathCategory === cat.category;

          return (
            <div
              key={cat.category}
              className={`bg-white rounded-xl border p-4 shadow-xs transition-colors ${
                cat.status === "OVER_BUDGET" || cat.status === "BREACHED"
                  ? "border-rose-300 bg-rose-50/10"
                  : cat.status === "RUNS_OUT_SOON" || cat.status === "BREACH_PROJECTED"
                  ? "border-amber-300 bg-amber-50/10"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{cat.category}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Spent: <span className="font-semibold text-slate-900">${cat.spent_mtd.toFixed(2)}</span> / Target: ${cat.budget_limit.toFixed(2)}
                  </div>
                </div>
                {getStatusBadge(cat.status, cat.projected_breach_day)}
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
                  <span>{cat.consumed_pct}% used</span>
                  <span>
                    {cat.remaining_headroom >= 0
                      ? `$${cat.remaining_headroom.toFixed(2)} left to spend`
                      : `-$${Math.abs(cat.remaining_headroom).toFixed(2)} over budget`}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(cat.status)}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Spend Pace Details */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pacing: <strong className="text-slate-900">${cat.daily_burn.toFixed(2)}/day</strong></span>
                </div>

                <div className="flex items-center space-x-1 text-slate-600">
                  <span>Month-end projection: </span>
                  <span className={`font-semibold ${isOverburn ? "text-amber-700 font-bold" : "text-slate-800"}`}>
                    ${cat.projected_month_end.toFixed(2)}
                  </span>
                </div>
              </div>

              {cat.projected_breach_day && (cat.status === "RUNS_OUT_SOON" || cat.status === "BREACH_PROJECTED") && (
                <div className="mt-2.5 text-[11px] text-amber-800 bg-amber-50 rounded p-2 border border-amber-200 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    At your current pace of ${cat.daily_burn.toFixed(2)}/day, this category is expected to run out by <strong>August {cat.projected_breach_day}</strong>.
                  </span>
                </div>
              )}

              {/* Hidden Math Breakdown Accordion (Closed by default) */}
              <div className="mt-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setExpandedMathCategory(isMathOpen ? null : cat.category)}
                  className="inline-flex items-center space-x-1 text-[11px] text-slate-500 hover:text-slate-700 font-medium transition-colors"
                >
                  <span>⚙️ View math breakdown</span>
                  {isMathOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {isMathOpen && (
                  <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div><strong>Daily Pace Formula:</strong> ${cat.spent_mtd.toFixed(2)} spent ÷ {budgets.days_elapsed} days = ${cat.daily_burn.toFixed(2)}/day</div>
                    <div><strong>Projection Formula:</strong> ${cat.daily_burn.toFixed(2)}/day × {budgets.days_in_month} total days = ${cat.projected_month_end.toFixed(2)}</div>
                    <div><strong>Headroom Remaining:</strong> ${cat.budget_limit.toFixed(2)} budget - ${cat.spent_mtd.toFixed(2)} spent = ${cat.remaining_headroom.toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
