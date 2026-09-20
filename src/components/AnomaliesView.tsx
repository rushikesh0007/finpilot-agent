import React, { useState } from "react";
import { AlertOctagon, Copy, Sparkles, ShieldAlert, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { AnomalyReport } from "../types";

interface AnomaliesViewProps {
  anomalies: AnomalyReport | null;
  loading: boolean;
}

export const AnomaliesView: React.FC<AnomaliesViewProps> = ({ anomalies, loading }) => {
  const [disputedIds, setDisputedIds] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showMath, setShowMath] = useState(false);

  if (loading || !anomalies) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const handleDispute = (id: string, merchant: string, amount: number) => {
    setDisputedIds((prev) => [...prev, id]);
    setActionMessage(`Dispute initiated for $${amount.toFixed(2)} at ${merchant}. A dispute note has been generated.`);
    setTimeout(() => setActionMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Unusual & Duplicate Charges</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              FinPilot automatically scans your statement for charges that look accidental or unusual: duplicate payments, sudden spikes, and high first-time store visits.
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
            <div className="flex items-center space-x-2 bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>{anomalies.total_anomalies_flagged} Items to Review</span>
            </div>
          </div>
        </div>

        {showMath && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div><strong>Duplicate Rule:</strong> Charges with exact same dollar amount and merchant within a 48-hour timestamp window.</div>
            <div><strong>Statistical Outlier Rule:</strong> Amount exceeds Category Average by more than 1.75 standard deviations (Z-score &gt; 1.75).</div>
            <div><strong>First-Time Store Rule:</strong> Merchant with no previous transaction history exceeding 2x the average daily shopping baseline.</div>
          </div>
        )}
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 1. Duplicate Charges (<48h window) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <Copy className="w-4 h-4 text-rose-600" />
            <span>Possible Duplicate Charges (Same amount within 48 hours)</span>
          </h3>
          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            {anomalies.duplicate_charges.length} Duplicate Found
          </span>
        </div>

        <div className="space-y-3">
          {anomalies.duplicate_charges.map((dup, idx) => {
            const isDisputed = disputedIds.includes(dup.duplicate_tx.id);
            return (
              <div key={idx} className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <span>{dup.merchant}</span>
                    <span className="text-rose-700 font-mono font-bold">${dup.amount.toFixed(2)}</span>
                  </div>
                  <p className="text-slate-600">{dup.reason}</p>
                  <div className="text-[11px] text-slate-500">
                    First charged on {dup.original_tx.date} • Second charge on {dup.duplicate_tx.date}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleDispute(dup.duplicate_tx.id, dup.merchant, dup.amount)}
                    disabled={isDisputed}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isDisputed
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-rose-600 hover:bg-rose-700 text-white shadow-2xs"
                    }`}
                  >
                    {isDisputed ? "Dispute Submitted" : "1-Click Dispute Charge"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Statistical Distance Spikes (>1.75 SD) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Unusually High Expenses</span>
          </h3>
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            {anomalies.statistical_spikes.length} Spike Found
          </span>
        </div>

        <div className="space-y-3">
          {anomalies.statistical_spikes.map((spike) => (
            <div key={spike.id} className="bg-amber-50/40 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <span>{spike.merchant}</span>
                  <span className="text-amber-800 font-mono font-bold">${spike.amount.toFixed(2)}</span>
                  <span className="text-[11px] font-normal text-slate-500">in {spike.category}</span>
                </div>
                <p className="text-slate-600">{spike.reason}</p>
                <div className="text-[11px] text-slate-500">
                  Typical {spike.category} average: ${spike.category_mean.toFixed(2)} • Charged on {spike.date}
                </div>
              </div>

              <div className="text-xs font-semibold px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200 shrink-0">
                Non-recurring expense
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. First-time Merchant Spikes */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-blue-600" />
            <span>First-Time Store Large Purchase</span>
          </h3>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            {anomalies.first_time_spikes.length} Found
          </span>
        </div>

        <div className="space-y-3">
          {anomalies.first_time_spikes.map((ft) => (
            <div key={ft.id} className="bg-blue-50/30 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <span>{ft.merchant}</span>
                  <span className="text-blue-800 font-mono font-bold">${ft.amount.toFixed(2)}</span>
                </div>
                <p className="text-slate-600">{ft.reason}</p>
                <div className="text-[11px] text-slate-500">
                  Charged on {ft.date} • Your typical shopping baseline is ${ft.daily_average_baseline.toFixed(2)}/day
                </div>
              </div>

              <div className="text-xs font-semibold px-2.5 py-1 rounded bg-white text-blue-700 border border-blue-200 shrink-0">
                New Store
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
