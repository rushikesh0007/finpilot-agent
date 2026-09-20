import React from "react";
import { ArrowUpRight, ArrowDownRight, PiggyBank, ShieldCheck, Flame } from "lucide-react";
import { MonthlySummary } from "../types";

interface MetricCardsProps {
  summary: MonthlySummary | null;
  loading: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ summary, loading }) => {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Money In */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Money In</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          ${summary.total_income.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div className="flex items-center text-xs text-slate-500 mt-2 space-x-1">
          <span className="font-semibold text-emerald-600">
            {summary.deposit_count !== undefined ? `${summary.deposit_count} ${summary.deposit_count === 1 ? "Deposit" : "Deposits"}` : "Income Inflows"}
          </span>
          <span>• Credited deposits</span>
        </div>
      </div>

      {/* 2. Money Spent */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Money Spent</span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          ${summary.total_expenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div className="flex items-center text-xs text-slate-500 mt-2 space-x-1">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-semibold text-slate-700">Avg. ${summary.daily_burn_rate.toFixed(2)}/day</span>
          <span>• Day {summary.days_elapsed} of {summary.days_in_month}</span>
        </div>
      </div>

      {/* 3. Leftover Cash */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Leftover Cash</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          ${summary.net_savings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div className="flex items-center text-xs text-slate-500 mt-2 space-x-1">
          <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            {summary.savings_rate_pct}% Saved
          </span>
          <span>• Solid healthy pace</span>
        </div>
      </div>

      {/* 4. Emergency Cushion */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Emergency Cushion</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          +${summary.buffer_headroom.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div className="flex items-center text-xs text-slate-500 mt-2 space-x-1">
          <span className="font-medium text-slate-600">
            ${summary.current_liquid_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })} in bank
          </span>
          <span>(Floor: ${summary.safety_buffer_minimum.toFixed(0)})</span>
        </div>
      </div>
    </div>
  );
};
