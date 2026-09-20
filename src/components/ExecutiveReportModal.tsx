import React, { useState } from "react";
import { X, Check, Copy, FileText, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import { ExecutiveReport } from "../types";

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ExecutiveReport | null;
  loading: boolean;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  report,
  loading
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!report) return;
    const text = `FINPILOT MONTHLY MONEY SUMMARY (${report.period})
Overall Status: ${report.executive_verdict}
Savings Rate: ${report.net_savings_rate} ($${report.net_savings_amount.toFixed(2)} leftover)
Money In: $${report.total_income.toFixed(2)} | Money Spent: $${report.total_expenses.toFixed(2)}
Emergency Cushion: ${report.cushion_buffer_status}

TOP 3 MONEY LEAKS:
${report.top_3_financial_leaks.map((l) => `${l.rank}. ${l.title} ($${l.leak_amount_mtd.toFixed(2)}) - ${l.impact}`).join("\n")}

WAYS TO SAVE:
${report.corrective_actions.map((a) => `- ${a.action} [${a.category}]: ${a.expected_gain} (${a.execution_effort})`).join("\n")}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Monthly Money Summary</h2>
              <p className="text-xs text-slate-500">Your easy-to-read financial overview • August 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading || !report ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              Generating your summary...
            </div>
          ) : (
            <>
              {/* Executive Verdict Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Overall Status
                </span>
                <div className="text-base font-extrabold text-emerald-950 mt-0.5">
                  {report.executive_verdict}
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200 text-xs">
                  <div>
                    <span className="text-emerald-700 block">Savings Rate:</span>
                    <strong className="text-emerald-950 text-sm">{report.net_savings_rate}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-700 block">Leftover Cash:</span>
                    <strong className="text-emerald-950 text-sm">${report.net_savings_amount.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-700 block">Emergency Cushion:</span>
                    <strong className="text-emerald-950 text-xs">+$2,450 Above Floor</strong>
                  </div>
                </div>
              </div>

              {/* Top 3 Financial Leaks */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Top 3 Money Leaks Found</span>
                </h3>
                <div className="space-y-2">
                  {report.top_3_financial_leaks.map((leak) => (
                    <div
                      key={leak.rank}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start space-x-3 text-xs"
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {leak.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{leak.title}</span>
                          <span className="font-mono font-semibold text-rose-600">
                            -${leak.leak_amount_mtd.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5 text-[11px]">{leak.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 Practical Ways to Save */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3 Practical Ways to Save</span>
                </h3>
                <div className="space-y-2">
                  {report.corrective_actions.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-emerald-200/80 bg-emerald-50/30 flex items-start space-x-3 text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{act.action}</div>
                        <div className="flex items-center space-x-3 text-[11px] mt-1 text-slate-600">
                          <span>Saves: <strong className="text-emerald-700">{act.expected_gain}</strong></span>
                          <span>•</span>
                          <span>Effort: <strong className="text-slate-700">{act.execution_effort}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleCopy}
            disabled={!report}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Executive Summary</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
