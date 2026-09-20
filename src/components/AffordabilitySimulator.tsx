import React, { useState } from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, ArrowRight, DollarSign, Calendar, Target, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { SimulationResult } from "../types";

interface AffordabilitySimulatorProps {
  onSimulate: (itemName: string, cost: number, isRecurring: boolean, monthlyEmi: number, goalTarget: string) => Promise<SimulationResult>;
  initialResult?: SimulationResult | null;
}

export const AffordabilitySimulator: React.FC<AffordabilitySimulatorProps> = ({
  onSimulate,
  initialResult
}) => {
  const [itemName, setItemName] = useState("New Workstation Laptop");
  const [cost, setCost] = useState<number>(750.0);
  const [isRecurring, setIsRecurring] = useState(false);
  const [monthlyEmi, setMonthlyEmi] = useState<number>(85.0);
  const [goalTarget, setGoalTarget] = useState("M4 Max Engineering Workstation");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(initialResult || null);
  const [showMath, setShowMath] = useState(false);

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await onSimulate(itemName, cost, isRecurring, monthlyEmi, goalTarget);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case "APPROVED":
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Yes, you can afford this!</span>
          </div>
        );
      case "CONDITIONAL":
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Yes, but with a trade-off</span>
          </div>
        );
      case "HIGH RISK":
      default:
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs sm:text-sm">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <span>Not recommended right now</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>"Can I Afford It?" Decision Simulator</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Before you buy, test whether a purchase fits your budget. We check upcoming bills before your next paycheck, protect your $1,000 emergency cushion, and show how your savings goals are affected.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <div>
              <div className="font-semibold text-slate-800">Next Paycheck: Sept 1, 2026</div>
              <div className="text-slate-500">13 days remaining in pay cycle</div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Inputs & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Input Form */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <Target className="w-4 h-4 text-slate-700" />
            <span>Enter Purchase Details</span>
          </h3>

          <form onSubmit={handleRunSimulation} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                What are you thinking of buying?
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. New Laptop, Weekend Trip, Gym Membership"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  How will you pay?
                </label>
                <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsRecurring(false)}
                    className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                      !isRecurring ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-500"
                    }`}
                  >
                    One-time
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRecurring(true)}
                    className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                      isRecurring ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-500"
                    }`}
                  >
                    Monthly Plan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {!isRecurring ? "Price ($)" : "Monthly Cost ($)"}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-semibold text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={!isRecurring ? cost : monthlyEmi}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      if (!isRecurring) setCost(val);
                      else setMonthlyEmi(val);
                    }}
                    className="w-full pl-6 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Savings Goal to Check Against
              </label>
              <select
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900"
              >
                <option value="M4 Max Engineering Workstation">New Workstation Laptop ($2,800 goal)</option>
                <option value="Japan Autumn Expedition">Vacation Trip ($3,500 goal)</option>
                <option value="Credit Card Zero-Balance Paydown">Pay Off Credit Card ($1,800 goal)</option>
                <option value="Emergency Cushion Buffer">Emergency Cushion ($1,000 floor)</option>
              </select>
            </div>

            {/* Quick Test Scenarios */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-500 mb-2 block">Quick Examples:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => { setItemName("Desk Chair"); setCost(450); setIsRecurring(false); }}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded"
                >
                  $450 Desk Chair
                </button>
                <button
                  type="button"
                  onClick={() => { setItemName("High-end Laptop"); setCost(2200); setIsRecurring(false); }}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded"
                >
                  $2,200 Laptop
                </button>
                <button
                  type="button"
                  onClick={() => { setItemName("Fitness Club"); setIsRecurring(true); setMonthlyEmi(85); }}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded"
                >
                  $85/mo Gym Plan
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center space-x-2 mt-4"
            >
              <span>{loading ? "Checking numbers..." : "Can I Afford This?"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right: Simulation Output & Stress Steps */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-slate-700" />
                <span>Decision Verdict</span>
              </h3>
              {result && getVerdictBadge(result.verdict)}
            </div>

            {result ? (
              <div className="space-y-4">
                {/* Result Callout */}
                <div
                  className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    result.verdict === "APPROVED"
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                      : result.verdict === "CONDITIONAL"
                      ? "bg-amber-50/60 border-amber-200 text-amber-950"
                      : "bg-rose-50/60 border-rose-200 text-rose-950"
                  }`}
                >
                  <p className="font-medium text-sm">{result.explanation}</p>
                  <div className="mt-2.5 pt-2 border-t border-black/10 font-semibold flex items-center space-x-1.5">
                    <span>Recommendation:</span>
                    <span className="font-normal">{result.remediation_condition}</span>
                  </div>
                </div>

                {/* Goal Trajectory Delay */}
                {result.goal_impact && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs flex items-center space-x-3">
                    <Target className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <span className="font-semibold text-blue-950">Goal Timeline Impact: </span>
                      <span className="text-blue-900">{result.goal_impact.summary}</span>
                    </div>
                  </div>
                )}

                {/* Collapsed Math Breakdown (Closed by default) */}
                <div className="pt-1">
                  <button
                    onClick={() => setShowMath(!showMath)}
                    className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-md transition-colors"
                  >
                    <span>⚙️ View math breakdown</span>
                    {showMath ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showMath && (
                    <div className="mt-3 space-y-2 text-xs border border-slate-200 bg-slate-50/70 p-3.5 rounded-xl">
                      <div className="font-semibold text-slate-700 mb-1">Calculation Steps:</div>

                      <div className="flex items-start space-x-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          1
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-slate-900">Upcoming Bills Before Payday:</span>
                          <p className="text-slate-600 mt-0.5">{result.stress_test_steps.Step_A_Project_Obligations}</p>
                        </div>
                        <span className="font-mono text-slate-500">-$140.00</span>
                      </div>

                      <div className="flex items-start space-x-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          2
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-slate-900">Purchase Deduction:</span>
                          <p className="text-slate-600 mt-0.5">{result.stress_test_steps.Step_B_Deduct_Proposed}</p>
                        </div>
                        <span className="font-mono font-semibold text-rose-600">-${result.immediate_deduction.toFixed(2)}</span>
                      </div>

                      <div className="flex items-start space-x-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          3
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-slate-900">Emergency Cushion Check ($1,000 floor):</span>
                          <p className="text-slate-600 mt-0.5">{result.stress_test_steps.Step_C_Check_Liquidity}</p>
                        </div>
                        <span className={`font-mono font-bold ${result.buffer_headroom >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {result.buffer_headroom >= 0 ? `+$${result.buffer_headroom.toFixed(2)} headroom` : `-$${Math.abs(result.buffer_headroom).toFixed(2)} deficit`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-6">
                <ShieldCheck className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs font-medium">Select or enter a proposed expense on the left to see the instant verdict.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
