import React from "react";
import { AlertTriangle, Clock, RefreshCw, Calendar, TrendingUp, CheckCircle, ShieldAlert } from "lucide-react";
import { RecurringAnalysis } from "../types";

interface SubscriptionBleedViewProps {
  recurring: RecurringAnalysis | null;
  loading: boolean;
}

export const SubscriptionBleedView: React.FC<SubscriptionBleedViewProps> = ({ recurring, loading }) => {
  if (loading || !recurring) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
              <span>Subscriptions & Upcoming Bills</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Keep track of recurring monthly services, spot sneaky price increases, and see what bills are coming due.
            </p>
          </div>
          <div className="flex items-center space-x-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500">Active Subscriptions: </span>
              <strong className="text-slate-900">{recurring.active_subscriptions_count}</strong>
            </div>
            <span className="text-slate-300">•</span>
            <div>
              <span className="text-slate-500">Total Monthly: </span>
              <strong className="text-slate-900">${recurring.total_monthly_recurring.toFixed(2)}/mo</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 Sneaky Price Increases */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Sneaky Price Increases Caught</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
            {recurring.inflation_alerts.length} Price Hikes
          </span>
        </div>
        <p className="text-xs text-amber-800 mb-4">
          These recurring bills went up compared to what you were paying before:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recurring.inflation_alerts.map((alert) => (
            <div key={alert.merchant} className="bg-white rounded-lg border border-amber-200 p-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{alert.merchant}</span>
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  +{alert.pct_increase}% increase
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                <div>Price: <del className="text-slate-400">${alert.old_price.toFixed(2)}</del> ➔ <strong className="text-slate-900">${alert.new_price.toFixed(2)}/mo</strong></div>
                <div className="text-[11px] text-rose-600 font-semibold">
                  Adds ${alert.annualized_leak.toFixed(2)}/year to your costs
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Bills Forecast (15, 30, 60 days) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-700" />
            <span>Upcoming Committed Bills (Rent, Utilities & Subscriptions)</span>
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Cash that is already spoken for so you never get caught short:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next 15 Days</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ${recurring.committed_obligations.next_15_days.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Covers September 1st Rent ($1,800), Gym ($75), and Electric Bill ($145.20).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next 30 Days</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ${recurring.committed_obligations.next_30_days.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Full monthly fixed bills (Rent, utilities, and all active subscriptions).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next 60 Days</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ${recurring.committed_obligations.next_60_days.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Two full months of fixed bills to ensure you stay ahead comfortably.
            </p>
          </div>
        </div>
      </div>

      {/* Subscriptions Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            All Recurring Services & Subscriptions
          </h3>
          <span className="text-xs text-slate-500">Auto-detected from your transaction history</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Service</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Frequency</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Price Change</th>
                <th className="py-2.5 px-4">Next Due Date</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recurring.subscriptions.map((s) => (
                <tr key={s.merchant} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{s.merchant}</td>
                  <td className="py-3 px-4 text-slate-600">{s.category}</td>
                  <td className="py-3 px-4 text-slate-600">{s.cadence}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">${s.current_amount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    {s.is_inflated ? (
                      <span className="text-rose-600 font-bold">+{s.pct_change_mom}%</span>
                    ) : (
                      <span className="text-slate-400">Stable</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{s.next_due_date}</td>
                  <td className="py-3 px-4">
                    {s.is_inflated ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Price Creep
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
