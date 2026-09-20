import React, { useState, useMemo } from "react";
import Papa from "papaparse";
import { X, Upload, CheckCircle, AlertCircle, ArrowRight, ArrowUpRight, ArrowDownRight, Wallet, ShieldCheck, Sparkles, FileSpreadsheet } from "lucide-react";
import { MonthlySummary } from "../types";

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestSuccess: (data: {
    filename: string;
    count: number;
    periodLabel: string;
    summary: MonthlySummary;
  }) => void;
}

const SEPTEMBER_2026_SAMPLE = `Date,Merchant,Category,Debit,Credit,Payment Mode
2026-09-01,TechCorp Payroll,Income,,3250.00,Direct Deposit
2026-09-01,Beacon Hill Apartments,Housing/Rent,1800.00,,ACH
2026-09-02,IronPeak Fitness,Healthcare,75.00,,AutoPay
2026-09-03,Metro Power & Light,Utilities,138.40,,AutoPay
2026-09-04,Blue Bottle Coffee,Dining Out,15.20,,Apple Pay
2026-09-05,City Municipal Water,Utilities,64.10,,AutoPay
2026-09-06,Trader Joe's,Groceries,88.50,,Debit Card
2026-09-07,Gigabit Fiber Net,Utilities,85.00,,Credit Card
2026-09-08,Netflix Premium,Discretionary,22.99,,Credit Card
2026-09-09,AWS Cloud Services,Tech/Cloud,68.50,,Credit Card
2026-09-11,Spotify Family,Discretionary,16.99,,Credit Card
2026-09-12,AI Tools Pro,Tech/Cloud,20.00,,Credit Card
2026-09-13,Sweetgreen,Dining Out,18.50,,Apple Pay
2026-09-14,Whole Foods Market,Groceries,112.30,,Credit Card
2026-09-15,TechCorp Payroll,Income,,3250.00,Direct Deposit
2026-09-16,Uber Transit,Transportation,31.25,,Credit Card
2026-09-17,Chevron Gas Station,Transportation,54.80,,Debit Card
2026-09-18,NordicTech Audio,Shopping,149.00,,Credit Card
2026-09-19,Amazon.com,Shopping,42.50,,Credit Card
2026-09-20,Osteria Bella Bistro,Dining Out,95.00,,Credit Card`;

const AUGUST_2026_SAMPLE = `Date,Merchant,Category,Debit,Credit,Payment Mode
2026-08-01,TechCorp Payroll,Income,,3250.00,Direct Deposit
2026-08-01,Beacon Hill Apartments,Housing/Rent,1800.00,,ACH
2026-08-02,IronPeak Fitness,Healthcare,75.00,,AutoPay
2026-08-03,Metro Power & Light,Utilities,145.20,,AutoPay
2026-08-05,Whole Foods Market,Groceries,82.40,,Debit Card
2026-08-08,Netflix Premium,Discretionary,22.99,,Credit Card
2026-08-09,AWS Cloud Services,Tech/Cloud,68.50,,Credit Card
2026-08-11,Spotify Family,Discretionary,16.99,,Credit Card
2026-08-14,Whole Foods Market,Groceries,74.50,,Credit Card
2026-08-15,Whole Foods Market,Groceries,74.50,,Credit Card
2026-08-15,TechCorp Payroll,Income,,3250.00,Direct Deposit
2026-08-17,Apex Specialty Dental,Healthcare,480.00,,Credit Card
2026-08-18,NordicTech Audio,Shopping,389.00,,Credit Card
2026-08-19,Blue Bottle Coffee,Dining Out,12.50,,Apple Pay`;

export const IngestModal: React.FC<IngestModalProps> = ({ isOpen, onClose, onIngestSuccess }) => {
  const [rawText, setRawText] = useState(SEPTEMBER_2026_SAMPLE);
  const [filename, setFilename] = useState("september_2026_statement.csv");
  const [fileType, setFileType] = useState<"csv" | "tsv">("csv");
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Parse CSV/TSV with PapaParse into structured rows
  const { previewRows, metrics, periodLabel } = useMemo(() => {
    if (!rawText.trim()) {
      return {
        previewRows: [],
        metrics: { totalIncome: 0, totalExpenses: 0, netSavings: 0, emergencyCushion: 0 },
        periodLabel: "Unknown Period"
      };
    }

    const parsed = Papa.parse(rawText.trim(), {
      header: true,
      skipEmptyLines: true
    });

    const data = parsed.data as Array<Record<string, string>>;
    if (!data || data.length === 0) {
      return {
        previewRows: [],
        metrics: { totalIncome: 0, totalExpenses: 0, netSavings: 0, emergencyCushion: 0 },
        periodLabel: "Unknown Period"
      };
    }

    // Flexible column finder
    const findKey = (row: Record<string, string>, candidates: string[]) => {
      const keys = Object.keys(row);
      for (const cand of candidates) {
        const found = keys.find((k) => k.toLowerCase().includes(cand));
        if (found) return found;
      }
      return null;
    };

    const firstRow = data[0] || {};
    const dateKey = findKey(firstRow, ["date", "txn_date", "timestamp", "posted"]) || "Date";
    const merchantKey = findKey(firstRow, ["merchant", "vendor", "payee", "description", "name"]) || "Merchant";
    const catKey = findKey(firstRow, ["category", "type", "tag"]) || "Category";
    const amtKey = findKey(firstRow, ["amount", "amt", "total", "net"]);
    const debitKey = findKey(firstRow, ["debit", "withdrawal", "outflow", "spent"]);
    const creditKey = findKey(firstRow, ["credit", "deposit", "inflow"]);

    let totalIncome = 0;
    let totalExpenses = 0;
    const dateMap: Record<string, number> = {};

    const rows = data.map((row, idx) => {
      const dateVal = row[dateKey] || "2026-09-01";
      const merchantVal = row[merchantKey] || "External Merchant";
      const categoryVal = row[catKey] || "General";

      let amountVal = 0;
      let isIncome = false;

      if (debitKey && creditKey) {
        const cStr = (row[creditKey] || "").replace(/[\$,]/g, "").trim();
        const dStr = (row[debitKey] || "").replace(/[\$,]/g, "").trim();
        if (cStr && parseFloat(cStr) > 0) {
          amountVal = parseFloat(cStr);
          isIncome = true;
          totalIncome += amountVal;
        } else if (dStr && parseFloat(dStr) > 0) {
          amountVal = parseFloat(dStr);
          isIncome = false;
          totalExpenses += amountVal;
        }
      } else if (amtKey && row[amtKey]) {
        const raw = parseFloat((row[amtKey] || "").replace(/[\$,]/g, "").trim());
        if (!isNaN(raw)) {
          if (raw > 0) {
            amountVal = raw;
            isIncome = true;
            totalIncome += amountVal;
          } else {
            amountVal = Math.abs(raw);
            isIncome = false;
            totalExpenses += amountVal;
          }
        }
      }

      // Track dates for period detection
      const match = dateVal.match(/^(\d{4})-(\d{1,2})/);
      if (match) {
        const ym = `${match[1]}-${match[2].padStart(2, "0")}`;
        dateMap[ym] = (dateMap[ym] || 0) + 1;
      }

      return {
        id: idx + 1,
        date: dateVal,
        merchant: merchantVal,
        category: categoryVal,
        amount: amountVal,
        isIncome
      };
    });

    // Detect month & year label
    let detectedPeriod = "September 2026";
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    if (Object.keys(dateMap).length > 0) {
      const topYm = Object.entries(dateMap).sort((a, b) => b[1] - a[1])[0][0];
      const [y, m] = topYm.split("-");
      const mIdx = parseInt(m, 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        detectedPeriod = `${monthNames[mIdx]} ${y}`;
      }
    }

    const netSavings = totalIncome - totalExpenses;
    // Emergency Cushion = Current bank balance minus the safety floor target ($1,000)
    // Bank balance starts at safety floor $1,000 + leftover cash
    const emergencyCushion = Math.max(0, netSavings);

    return {
      previewRows: rows,
      metrics: {
        totalIncome,
        totalExpenses,
        netSavings,
        emergencyCushion
      },
      periodLabel: detectedPeriod
    };
  }, [rawText]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const isTsv = file.name.endsWith(".tsv");
    setFileType(isTsv ? "tsv" : "csv");
    setError(null);

    Papa.parse(file, {
      complete: (results) => {
        // Unparse back to CSV format for consistent state storage
        const unparsed = Papa.unparse(results.data);
        setRawText(unparsed);
      },
      error: (err) => {
        setError("CSV Parse Error: " + err.message);
      }
    });
  };

  const handleLoadSample = (sample: string, name: string) => {
    setRawText(sample);
    setFilename(name);
    setFileType("csv");
    setError(null);
    setResultMessage(null);
  };

  const handleIngest = async () => {
    setLoading(true);
    setError(null);
    setResultMessage(null);

    try {
      const res = await fetch("/api/finance/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: rawText,
          file_type: fileType,
          filename: filename
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to ingest statement");
      }

      setResultMessage(
        `Successfully loaded ${data.filename} (${data.period_label}) with ${data.ingested_count} transactions!`
      );

      // Trigger immediate dashboard update
      onIngestSuccess({
        filename: data.filename,
        count: data.ingested_count,
        periodLabel: data.period_label,
        summary: data.summary
      });

      // Brief delay so user sees confirmation before modal unmounts
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to process statement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Upload className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">Import Statement</h2>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  PapaParse Powered
                </span>
              </div>
              <p className="text-xs text-slate-500">Upload bank or credit card exports (CSV/TSV) to update all dashboard cards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Quick statement presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Quick Samples:</span>
            <button
              type="button"
              onClick={() => handleLoadSample(SEPTEMBER_2026_SAMPLE, "september_2026_statement.csv")}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-all flex items-center space-x-1 ${
                filename.includes("september")
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>September 2026 Statement (New Month)</span>
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample(AUGUST_2026_SAMPLE, "august_2026_statement.csv")}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-all flex items-center space-x-1 ${
                filename.includes("august")
                  ? "bg-slate-100 text-slate-800 border-slate-300"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <FileSpreadsheet className="w-3 h-3 text-slate-500" />
              <span>August 2026 Statement</span>
            </button>
          </div>

          {/* File Upload Trigger */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center space-x-1.5 shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Choose File (CSV/TSV)</span>
                <input type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
              <span className="text-xs text-slate-500 truncate max-w-[200px] font-mono">
                {filename}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 font-medium">Format:</span>
              <button
                type="button"
                onClick={() => setFileType("csv")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  fileType === "csv" ? "bg-slate-900 text-white" : "text-slate-600 bg-white border border-slate-200"
                }`}
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => setFileType("tsv")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  fileType === "tsv" ? "bg-slate-900 text-white" : "text-slate-600 bg-white border border-slate-200"
                }`}
              >
                TSV
              </button>
            </div>
          </div>

          {/* Recalculated 4 Top Metrics Preview Bar */}
          <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-2 border-b border-slate-800 pb-1.5">
              <span className="font-semibold uppercase tracking-wider text-slate-400">
                Calculated Metrics Preview
              </span>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {periodLabel}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  <span>Money In</span>
                </div>
                <div className="text-sm font-bold text-emerald-400">
                  ${metrics.totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                  <ArrowDownRight className="w-3 h-3 text-rose-400" />
                  <span>Money Spent</span>
                </div>
                <div className="text-sm font-bold text-rose-300">
                  ${metrics.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                  <Wallet className="w-3 h-3 text-blue-400" />
                  <span>Leftover Cash</span>
                </div>
                <div className="text-sm font-bold text-blue-300">
                  ${metrics.netSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>Emergency Cushion</span>
                </div>
                <div className="text-sm font-bold text-amber-300">
                  +${metrics.emergencyCushion.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Statement Preview Table */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-800">
                Parsed Transactions ({previewRows.length})
              </label>
              <span className="text-slate-500 text-[11px]">
                Target: {periodLabel}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Merchant</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {previewRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No transactions found in this statement.
                      </td>
                    </tr>
                  ) : (
                    previewRows.slice(0, 15).map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-600 font-mono text-[11px]">
                          {row.date}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {row.merchant}
                        </td>
                        <td className="py-2 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                            {row.category}
                          </span>
                        </td>
                        <td className={`py-2 px-3 text-right font-semibold whitespace-nowrap ${
                          row.isIncome ? "text-emerald-600 font-bold" : "text-slate-900"
                        }`}>
                          {row.isIncome ? `+$${row.amount.toFixed(2)}` : `-$${row.amount.toFixed(2)}`}
                        </td>
                      </tr>
                    ))
                  )}
                  {previewRows.length > 15 && (
                    <tr>
                      <td colSpan={4} className="py-2 text-center text-[11px] text-slate-400 bg-slate-50/50">
                        + {previewRows.length - 15} more transactions in statement
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {resultMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center space-x-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{resultMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleIngest}
            disabled={loading || previewRows.length === 0}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <span>{loading ? "Recalculating & Ingesting..." : "Import Transactions"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
