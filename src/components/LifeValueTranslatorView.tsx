import React, { useState } from "react";
import { Sparkles, ArrowRight, Target, Laptop, ChevronDown, ChevronUp } from "lucide-react";
import { OpportunityCostResult } from "../types";

interface LifeValueTranslatorViewProps {
  opportunity: OpportunityCostResult | null;
  loading: boolean;
}

export const LifeValueTranslatorView: React.FC<LifeValueTranslatorViewProps> = ({
  opportunity,
  loading
}) => {
  const [showMath, setShowMath] = useState(false);

  if (loading || !opportunity) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Goal Impact & Trade-Offs</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Cutting expenses is easier when you see what you gain. Here is how trimming subscriptions or price creep speeds up your actual life goals.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMath(!showMath)}
              className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <span>⚙️ View math breakdown</span>
              {showMath ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <div className="bg-emerald-50 text-emerald-950 border border-emerald-200 px-3 py-2 rounded-lg text-xs">
              <div className="font-bold">Total Subscription Cost: ${opportunity.total_subscription_bleed_monthly.toFixed(2)}/mo</div>
              <div className="text-emerald-700 font-medium">${opportunity.annualized_leak.toFixed(2)}/year you could redirect</div>
            </div>
          </div>
        </div>

        {showMath && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <div><strong>Annualized Savings:</strong> Monthly Saved Amount × 12 months</div>
            <div><strong>Weeks Saved:</strong> (Target Goal Balance Remaining ÷ Monthly Reallocation) × 4.33 weeks</div>
            <div><strong>Goal Benchmark:</strong> New Laptop ($1,500.00) with $650.00 left to save.</div>
          </div>
        )}
      </div>

      {/* Target Milestone Status Card */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Savings Goal</span>
            <div className="text-base font-bold text-white">{opportunity.target_goal}</div>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs text-slate-300">
          <div>
            <span className="text-slate-400 block">Left to Save:</span>
            <span className="font-bold text-emerald-400 text-sm">${opportunity.target_remaining.toFixed(2)}</span>
          </div>
          <div className="hidden md:block">
            <span className="text-slate-400 block">Estimated Completion:</span>
            <span className="font-bold text-white text-sm">November 2026</span>
          </div>
        </div>
      </div>

      {/* Reallocation Translations */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Target className="w-4 h-4 text-slate-700" />
          <span>What You Gain by Trimming Subscriptions</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {opportunity.translations.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-900">{item.action}</span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    +${item.monthly_saved}/mo
                  </span>
                </div>

                <div className="text-xs text-slate-500 mb-3">
                  Saves <strong className="text-slate-800">${item.annual_saved.toFixed(2)} every year</strong>.
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-950 font-medium leading-relaxed">
                  🌱 <strong>What this gets you:</strong> {item.life_value}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Direct goal impact</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
