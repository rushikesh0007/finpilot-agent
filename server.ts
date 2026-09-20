import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize Gemini Client lazily
let genaiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genaiClient && process.env.GEMINI_API_KEY) {
    genaiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genaiClient;
}

// -----------------------------------------------------------------------------
// IN-MEMORY DETERMINISTIC FINANCE ENGINE (August 2026 Context)
// Mirror of tools.py & mock_data.py for high-speed deterministic web execution
// -----------------------------------------------------------------------------

interface Transaction {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number; // positive = credit, negative = debit
  type: "credit" | "debit";
  payment_mode: string;
  notes?: string;
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  horizon: string;
  status: string;
}

interface UserProfile {
  user_id: string;
  name: string;
  currency: string;
  monthly_salary: number;
  pay_frequency: string;
  pay_days: string[];
  next_paycheck_date: string;
  current_liquid_balance: number;
  safety_buffer_minimum: number;
  goals: Goal[];
  category_budgets: Record<string, number>;
}

const INITIAL_PROFILE: UserProfile = {
  user_id: "usr_hackathon_2026",
  name: "Alex Mercer",
  currency: "USD",
  monthly_salary: 6500.0,
  pay_frequency: "bi-weekly",
  pay_days: ["2026-08-01", "2026-08-15"],
  next_paycheck_date: "2026-09-01",
  current_liquid_balance: 3450.0,
  safety_buffer_minimum: 1000.0,
  goals: [
    {
      id: "goal_emergency",
      name: "Emergency Cushion Buffer",
      target_amount: 1000.0,
      current_amount: 1000.0,
      horizon: "Immediate",
      status: "Achieved"
    },
    {
      id: "goal_laptop",
      name: "M4 Max Engineering Workstation",
      target_amount: 2800.0,
      current_amount: 1450.0,
      target_date: "2026-11-30",
      horizon: "Medium-Term",
      status: "In Progress"
    },
    {
      id: "goal_travel",
      name: "Japan Autumn Expedition",
      target_amount: 3500.0,
      current_amount: 1200.0,
      target_date: "2026-10-15",
      horizon: "Milestone",
      status: "In Progress"
    },
    {
      id: "goal_debt",
      name: "Credit Card Zero-Balance Paydown",
      target_amount: 1800.0,
      current_amount: 1200.0,
      target_date: "2026-09-30",
      horizon: "Short-Term",
      status: "In Progress"
    }
  ],
  category_budgets: {
    "Housing/Rent": 1800.0,
    "Utilities": 350.0,
    "Groceries": 550.0,
    "Dining Out": 400.0,
    "Transportation": 250.0,
    "Shopping": 350.0,
    "Tech/Cloud": 150.0,
    "Healthcare": 200.0,
    "Discretionary": 250.0
  }
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "tx_001", date: "2026-08-01", merchant: "TechCorp Payroll", category: "Income", amount: 3250.0, type: "credit", payment_mode: "Direct Deposit", notes: "Bi-weekly salary" },
  { id: "tx_002", date: "2026-08-15", merchant: "TechCorp Payroll", category: "Income", amount: 3250.0, type: "credit", payment_mode: "Direct Deposit", notes: "Bi-weekly salary" },
  { id: "tx_003", date: "2026-08-01", merchant: "Beacon Hill Apartments", category: "Housing/Rent", amount: -1800.0, type: "debit", payment_mode: "ACH", notes: "Monthly Rent" },
  { id: "tx_004", date: "2026-08-03", merchant: "Metro Power & Light", category: "Utilities", amount: -145.2, type: "debit", payment_mode: "AutoPay", notes: "Electric Utility" },
  { id: "tx_005", date: "2026-08-05", merchant: "City Municipal Water", category: "Utilities", amount: -68.5, type: "debit", payment_mode: "AutoPay", notes: "Water & Sewage" },
  { id: "tx_006", date: "2026-08-07", merchant: "Gigabit Fiber Net", category: "Utilities", amount: -85.0, type: "debit", payment_mode: "Credit Card", notes: "Home Internet" },
  { id: "tx_007", date: "2026-08-08", merchant: "Netflix Premium", category: "Discretionary", amount: -22.99, type: "debit", payment_mode: "Credit Card", notes: "Streaming Subscription" },
  { id: "tx_008", date: "2026-08-09", merchant: "AWS Cloud Services", category: "Tech/Cloud", amount: -68.5, type: "debit", payment_mode: "Credit Card", notes: "Cloud infrastructure" },
  { id: "tx_009", date: "2026-08-11", merchant: "Spotify Family", category: "Discretionary", amount: -16.99, type: "debit", payment_mode: "Credit Card", notes: "Music streaming" },
  { id: "tx_010", date: "2026-08-02", merchant: "IronPeak Fitness", category: "Healthcare", amount: -75.0, type: "debit", payment_mode: "AutoPay", notes: "Monthly gym membership" },
  { id: "tx_011", date: "2026-08-12", merchant: "AI Tools Pro", category: "Tech/Cloud", amount: -20.0, type: "debit", payment_mode: "Credit Card", notes: "AI Subscription" },
  { id: "tx_012", date: "2026-08-14", merchant: "NYTimes Digital", category: "Discretionary", amount: -17.0, type: "debit", payment_mode: "Credit Card", notes: "News publication" },
  { id: "tx_013", date: "2026-08-02", merchant: "Trader Joe's", category: "Groceries", amount: -94.2, type: "debit", payment_mode: "Debit Card", notes: "Weekly grocery run" },
  { id: "tx_014", date: "2026-08-08", merchant: "Whole Foods Market", category: "Groceries", amount: -118.45, type: "debit", payment_mode: "Credit Card", notes: "Organic produce" },
  // Duplicate charge anomaly (<48h window)
  { id: "tx_015", date: "2026-08-14", merchant: "Whole Foods Market", category: "Groceries", amount: -74.5, type: "debit", payment_mode: "Credit Card", notes: "Pantry restock" },
  { id: "tx_016", date: "2026-08-15", merchant: "Whole Foods Market", category: "Groceries", amount: -74.5, type: "debit", payment_mode: "Credit Card", notes: "Duplicate billing error" },
  // Dining Out velocity
  { id: "tx_017", date: "2026-08-03", merchant: "Chipotle Mexican Grill", category: "Dining Out", amount: -22.5, type: "debit", payment_mode: "Apple Pay", notes: "Lunch" },
  { id: "tx_018", date: "2026-08-04", merchant: "Blue Bottle Coffee", category: "Dining Out", amount: -14.8, type: "debit", payment_mode: "Apple Pay", notes: "Morning coffee" },
  { id: "tx_019", date: "2026-08-06", merchant: "Osteria Bella Bistro", category: "Dining Out", amount: -135.0, type: "debit", payment_mode: "Credit Card", notes: "Dinner with colleagues" },
  { id: "tx_020", date: "2026-08-10", merchant: "Sweetgreen", category: "Dining Out", amount: -19.75, type: "debit", payment_mode: "Apple Pay", notes: "Lunch salad" },
  { id: "tx_021", date: "2026-08-13", merchant: "Blue Bottle Coffee", category: "Dining Out", amount: -15.4, type: "debit", payment_mode: "Apple Pay", notes: "Coffee & pastry" },
  { id: "tx_022", date: "2026-08-16", merchant: "Izakaya Sakura", category: "Dining Out", amount: -142.0, type: "debit", payment_mode: "Credit Card", notes: "Weekend social dinner" },
  { id: "tx_023", date: "2026-08-18", merchant: "Blue Bottle Coffee", category: "Dining Out", amount: -16.2, type: "debit", payment_mode: "Apple Pay", notes: "Coffee meeting" },
  // Transportation
  { id: "tx_024", date: "2026-08-04", merchant: "Uber Transit", category: "Transportation", amount: -34.5, type: "debit", payment_mode: "Credit Card", notes: "Airport ride" },
  { id: "tx_025", date: "2026-08-09", merchant: "Chevron Gas Station", category: "Transportation", amount: -58.2, type: "debit", payment_mode: "Debit Card", notes: "Fuel fill-up" },
  { id: "tx_026", date: "2026-08-17", merchant: "Metro Transit Pass", category: "Transportation", amount: -45.0, type: "debit", payment_mode: "Apple Pay", notes: "Subway transit pass" },
  // Shopping
  { id: "tx_027", date: "2026-08-05", merchant: "Amazon.com", category: "Shopping", amount: -48.9, type: "debit", payment_mode: "Credit Card", notes: "Desk cables" },
  { id: "tx_028", date: "2026-08-11", merchant: "Uniqlo Apparel", category: "Shopping", amount: -89.5, type: "debit", payment_mode: "Credit Card", notes: "Summer basics" },
  // First-time merchant anomaly
  { id: "tx_029", date: "2026-08-12", merchant: "NordicTech Audio", category: "Shopping", amount: -389.0, type: "debit", payment_mode: "Credit Card", notes: "Noise-cancelling headphones" },
  // Statistical spike anomaly (>1.75 SD)
  { id: "tx_030", date: "2026-08-17", merchant: "Apex Specialty Dental", category: "Healthcare", amount: -480.0, type: "debit", payment_mode: "Credit Card", notes: "Crown replacement" }
];

let stateTransactions = [...INITIAL_TRANSACTIONS];
let stateProfile = { ...INITIAL_PROFILE };
let activePeriod = {
  month: 8,
  year: 2026,
  label: "August 2026",
  as_of_date: "2026-08-19",
  filename: "sample_august_2026.csv"
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Categorization helper
function categorize(merchant: string, rawCategory: string = ""): string {
  const m = merchant.toLowerCase();
  const c = rawCategory.toLowerCase();
  const rules: Record<string, string[]> = {
    "Housing/Rent": ["apartment", "rent", "beacon hill", "mortgage", "realty"],
    "Utilities": ["power", "electric", "water", "fiber", "internet", "utility"],
    "Groceries": ["whole foods", "trader joe", "safeway", "kroger", "grocery", "produce", "market"],
    "Dining Out": ["chipotle", "coffee", "blue bottle", "bistro", "osteria", "starbucks", "sweetgreen", "izakaya", "restaurant"],
    "Transportation": ["uber", "lyft", "chevron", "shell", "transit", "subway", "metro pass", "gas"],
    "Tech/Cloud": ["aws", "google cloud", "azure", "ai tools", "openai", "github"],
    "Healthcare": ["dental", "health", "clinic", "pharmacy", "doctor", "fitness", "ironpeak", "gym"],
    "Shopping": ["amazon", "uniqlo", "nordictech", "audio", "gear", "target", "walmart"],
    "Discretionary": ["netflix", "spotify", "nytimes", "hulu", "cinema", "entertainment"],
    "Income": ["payroll", "salary", "techcorp", "direct deposit", "bonus"]
  };

  for (const [cat, words] of Object.entries(rules)) {
    if (words.some((w) => m.includes(w) || c.includes(w))) {
      return cat;
    }
  }
  return "Discretionary";
}

// Deterministic Math Functions
function computeSummary(month = activePeriod.month, year = activePeriod.year) {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const monthTxs = stateTransactions.filter((t) => t.date.startsWith(monthStr));
  const targetTxs = monthTxs.length > 0 ? monthTxs : stateTransactions;

  const totalIncome = targetTxs.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = targetTxs.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const daysInMonth = new Date(year, month, 0).getDate();
  const dayDates = targetTxs.map((t) => {
    const parts = t.date.split("-");
    return parts.length >= 3 ? parseInt(parts[2], 10) : 1;
  }).filter((d) => !isNaN(d) && d > 0);

  const daysElapsed = dayDates.length > 0 ? Math.min(daysInMonth, Math.max(...dayDates)) : (month === 8 ? 19 : 20);
  const dailyBurn = daysElapsed > 0 ? totalExpenses / daysElapsed : 0;
  const projectedMonthEnd = dailyBurn * daysInMonth;

  const categoryTotals: Record<string, number> = {};
  for (const t of targetTxs) {
    if (t.amount < 0) {
      categoryTotals[t.category] = Number(((categoryTotals[t.category] || 0) + Math.abs(t.amount)).toFixed(2));
    }
  }

  const depositCount = targetTxs.filter((t) => t.amount > 0).length;
  const expenseCount = targetTxs.filter((t) => t.amount < 0).length;

  return {
    period: `${year}-${String(month).padStart(2, "0")}`,
    period_label: `${MONTH_NAMES[month - 1]} ${year}`,
    as_of_date: activePeriod.as_of_date,
    days_elapsed: daysElapsed,
    days_in_month: daysInMonth,
    total_income: Number(totalIncome.toFixed(2)),
    total_expenses: Number(totalExpenses.toFixed(2)),
    net_savings: Number(netSavings.toFixed(2)),
    savings_rate_pct: Number(savingsRate.toFixed(2)),
    daily_burn_rate: Number(dailyBurn.toFixed(2)),
    projected_month_end_expense: Number(projectedMonthEnd.toFixed(2)),
    current_liquid_balance: stateProfile.current_liquid_balance,
    safety_buffer_minimum: stateProfile.safety_buffer_minimum,
    buffer_headroom: Number((stateProfile.current_liquid_balance - stateProfile.safety_buffer_minimum).toFixed(2)),
    category_totals: categoryTotals,
    deposit_count: depositCount,
    expense_count: expenseCount
  };
}

function computeBudgets() {
  const summary = computeSummary(activePeriod.month, activePeriod.year);
  const budgets = stateProfile.category_budgets;
  const daysElapsed = summary.days_elapsed;
  const daysInMonth = summary.days_in_month;

  const categories = Object.entries(budgets).map(([cat, limit]) => {
    const spent = summary.category_totals[cat] || 0;
    const consumedPct = Number(((spent / limit) * 100).toFixed(1));
    const remaining = Number((limit - spent).toFixed(2));
    const dailyRate = daysElapsed > 0 ? spent / daysElapsed : 0;
    const projectedSpend = Number((dailyRate * daysInMonth).toFixed(2));
    const velocityPct = Number(((projectedSpend / limit) * 100).toFixed(1));

    let status = "HEALTHY";
    let alertColor = "green";
    let projectedBreachDay: number | null = null;

    if (spent > limit) {
      status = "OVER_BUDGET";
      alertColor = "red";
      projectedBreachDay = daysElapsed;
    } else if (velocityPct > 100) {
      status = "RUNS_OUT_SOON";
      alertColor = "amber";
      projectedBreachDay = Math.ceil(limit / dailyRate);
    } else if (consumedPct > 80) {
      status = "WATCH";
      alertColor = "amber";
    }

    return {
      category: cat,
      budget_limit: limit,
      spent_mtd: spent,
      consumed_pct: consumedPct,
      remaining_headroom: remaining,
      daily_burn: Number(dailyRate.toFixed(2)),
      projected_month_end: projectedSpend,
      velocity_pct: velocityPct,
      status,
      alert_color: alertColor,
      projected_breach_day: projectedBreachDay,
      projected_runout_day: projectedBreachDay
    };
  });

  categories.sort((a, b) => b.velocity_pct - a.velocity_pct);

  const overallBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
  const overallSpent = categories.reduce((sum, c) => sum + c.spent_mtd, 0);

  return {
    days_elapsed: daysElapsed,
    days_in_month: daysInMonth,
    overall_budget: Number(overallBudget.toFixed(2)),
    overall_spent_mtd: Number(overallSpent.toFixed(2)),
    overall_consumed_pct: Number(((overallSpent / overallBudget) * 100).toFixed(1)),
    categories
  };
}

function computeRecurring() {
  const subscriptions = [
    { merchant: "Netflix Premium", category: "Discretionary", cadence: "Monthly", current_amount: 22.99, previous_amount: 17.99, pct_change_mom: 27.79, is_inflated: true, next_due_date: "2026-09-08" },
    { merchant: "AWS Cloud Services", category: "Tech/Cloud", cadence: "Monthly", current_amount: 68.50, previous_amount: 51.00, pct_change_mom: 34.31, is_inflated: true, next_due_date: "2026-09-09" },
    { merchant: "NYTimes Digital", category: "Discretionary", cadence: "Monthly", current_amount: 17.00, previous_amount: 12.00, pct_change_mom: 41.67, is_inflated: true, next_due_date: "2026-09-14" },
    { merchant: "Spotify Family", category: "Discretionary", cadence: "Monthly", current_amount: 16.99, previous_amount: 16.99, pct_change_mom: 0.0, is_inflated: false, next_due_date: "2026-09-11" },
    { merchant: "IronPeak Fitness", category: "Healthcare", cadence: "Monthly", current_amount: 75.00, previous_amount: 75.00, pct_change_mom: 0.0, is_inflated: false, next_due_date: "2026-09-02" },
    { merchant: "AI Tools Pro", category: "Tech/Cloud", cadence: "Monthly", current_amount: 20.00, previous_amount: 20.00, pct_change_mom: 0.0, is_inflated: false, next_due_date: "2026-09-12" }
  ];

  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.current_amount, 0);

  const inflationAlerts = subscriptions.filter((s) => s.is_inflated).map((s) => ({
    merchant: s.merchant,
    old_price: s.previous_amount,
    new_price: s.current_amount,
    pct_increase: s.pct_change_mom,
    annualized_leak: Number(((s.current_amount - s.previous_amount) * 12).toFixed(2)),
    description: `Silent price creep of ${s.pct_change_mom}% from $${s.previous_amount.toFixed(2)} to $${s.current_amount.toFixed(2)}`
  }));

  const upcoming15 = 1800.0 + 75.0 + 145.2; // Rent + Gym + Power
  const upcoming30 = 1800.0 + 298.7 + totalMonthly;
  const upcoming60 = upcoming30 * 2;

  return {
    total_monthly_recurring: Number(totalMonthly.toFixed(2)),
    active_subscriptions_count: subscriptions.length,
    subscriptions,
    inflation_alerts: inflationAlerts,
    committed_obligations: {
      next_15_days: Number(upcoming15.toFixed(2)),
      next_30_days: Number(upcoming30.toFixed(2)),
      next_60_days: Number(upcoming60.toFixed(2))
    }
  };
}

function computeAnomalies() {
  const debits = stateTransactions.filter((t) => t.amount < 0);

  // Group by category
  const groups: Record<string, number[]> = {};
  for (const t of debits) {
    groups[t.category] = groups[t.category] || [];
    groups[t.category].push(Math.abs(t.amount));
  }

  const spikes = [];
  for (const t of debits) {
    const arr = groups[t.category];
    if (arr && arr.length > 1) {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
      const stdDev = Math.sqrt(variance);
      const amt = Math.abs(t.amount);
      if (stdDev > 0) {
        const zScore = (amt - mean) / stdDev;
        if (zScore > 1.75) {
          spikes.push({
            id: t.id,
            date: t.date,
            merchant: t.merchant,
            category: t.category,
            amount: amt,
            category_mean: Number(mean.toFixed(2)),
            z_score: Number(zScore.toFixed(2)),
            reason: `Statistical distance spike: ${zScore.toFixed(2)}σ standard deviations above category average ($${mean.toFixed(2)})`
          });
        }
      }
    }
  }

  // Duplicate charges (<48h window)
  const duplicates = [];
  for (let i = 0; i < debits.length; i++) {
    for (let j = i + 1; j < debits.length; j++) {
      const t1 = debits[i];
      const t2 = debits[j];
      const d1 = new Date(t1.date).getTime();
      const d2 = new Date(t2.date).getTime();
      const diffHours = Math.abs(d2 - d1) / (1000 * 3600);
      if (diffHours <= 48 && t1.merchant.toLowerCase() === t2.merchant.toLowerCase() && Math.abs(t1.amount) === Math.abs(t2.amount)) {
        duplicates.push({
          original_tx: t1,
          duplicate_tx: t2,
          merchant: t1.merchant,
          amount: Math.abs(t1.amount),
          window_hours: diffHours,
          reason: `Identical charge of $${Math.abs(t1.amount).toFixed(2)} detected within ${Math.round(diffHours)} hours at ${t1.merchant}`
        });
      }
    }
  }

  const firstTime = [
    {
      id: "tx_029",
      date: "2026-08-12",
      merchant: "NordicTech Audio",
      category: "Shopping",
      amount: 389.0,
      daily_average_baseline: 65.0,
      reason: "New, unindexed merchant. Single transaction of $389.00 exceeds standard daily shopping baseline by 498%."
    }
  ];

  return {
    total_anomalies_flagged: spikes.length + duplicates.length + firstTime.length,
    statistical_spikes: spikes,
    duplicate_charges: duplicates,
    first_time_spikes: firstTime
  };
}

function computeSimulation(itemName: string, cost: number, isRecurring = false, monthlyEmi = 0, goalTarget = "M4 Max Engineering Workstation") {
  const liquid = stateProfile.current_liquid_balance;
  const minBuffer = stateProfile.safety_buffer_minimum;
  const upcomingCommitted = 140.0; // Aug 19 to Sept 01 obligations
  const deduction = isRecurring && monthlyEmi > 0 ? monthlyEmi : cost;
  const projectedLiquidity = liquid - upcomingCommitted - deduction;
  const safeHeadroom = projectedLiquidity - minBuffer;

  let verdict = "APPROVED";
  let verdictColor = "green";
  let explanation = "";
  let remediation = "";

  if (projectedLiquidity < minBuffer) {
    verdict = "HIGH RISK";
    verdictColor = "red";
    const deficit = minBuffer - projectedLiquidity;
    explanation = `Proposed purchase of ${itemName} ($${deduction.toFixed(2)}) brings available cash to $${projectedLiquidity.toFixed(2)}, dipping below your emergency cushion ($${minBuffer.toFixed(2)}) by $${deficit.toFixed(2)} before the Sept 1 paycheck.`;
    remediation = `Postpone purchase until September 1 paycheck or find a $${deficit.toFixed(2)} temporary savings offset.`;
  } else if (safeHeadroom < 300) {
    verdict = "CONDITIONAL";
    verdictColor = "amber";
    const cutNeeded = 300 - safeHeadroom;
    explanation = `Purchase of ${itemName} is possible but leaves a slim margin of $${safeHeadroom.toFixed(2)} above your emergency cushion.`;
    remediation = `Approved only if Dining Out and flexible expenses are reduced by at least $${cutNeeded.toFixed(2)} across the next 12 days.`;
  } else {
    verdict = "APPROVED";
    verdictColor = "green";
    explanation = `Purchase of ${itemName} for $${deduction.toFixed(2)} is cleared. Post-purchase liquidity remains at $${projectedLiquidity.toFixed(2)}, preserving $${safeHeadroom.toFixed(2)} in excess headroom above the $${minBuffer.toFixed(2)} safety floor.`;
    remediation = "Proceed with purchase; ledger transaction in corresponding category.";
  }

  const targetGoal = stateProfile.goals.find((g) => g.name.toLowerCase().includes(goalTarget.toLowerCase())) || stateProfile.goals[1];
  const delayDays = Number(((deduction / (2250 * 0.4)) * 30).toFixed(1));

  return {
    item_name: itemName,
    cost,
    is_recurring: isRecurring,
    immediate_deduction: deduction,
    current_liquid_balance: liquid,
    upcoming_fixed_commitments_pre_pay: upcomingCommitted,
    projected_liquidity: Number(projectedLiquidity.toFixed(2)),
    safety_buffer_minimum: minBuffer,
    buffer_headroom: Number(safeHeadroom.toFixed(2)),
    verdict,
    verdict_color: verdictColor,
    explanation,
    remediation_condition: remediation,
    goal_impact: {
      goal_name: targetGoal.name,
      target_amount: targetGoal.target_amount,
      current_amount: targetGoal.current_amount,
      trajectory_delay_days: delayDays,
      summary: `Executing this $${deduction.toFixed(2)} purchase delays your '${targetGoal.name}' completion milestone by ${delayDays} days.`
    },
    stress_test_steps: {
      Step_A_Project_Obligations: `Projected guaranteed recurring bills before next paycheck (2026-09-01): $${upcomingCommitted.toFixed(2)}.`,
      Step_B_Deduct_Proposed: `Deducted $${deduction.toFixed(2)} for ${itemName} from $${liquid.toFixed(2)}.`,
      Step_C_Check_Liquidity: `Calculated post-purchase liquid balance ($${projectedLiquidity.toFixed(2)}) against safety reserve ($${minBuffer.toFixed(2)}).`,
      Step_D_Deterministic_Verdict: `Verdict rendered as ${verdict}.`
    }
  };
}

function computeOpportunity() {
  const totalMonthlyBleed = 108.49;
  const annualLeak = totalMonthlyBleed * 12;
  const targetGoal = stateProfile.goals[1]; // Laptop
  const remaining = targetGoal.target_amount - targetGoal.current_amount;

  return {
    target_goal: targetGoal.name,
    target_remaining: remaining,
    total_subscription_bleed_monthly: totalMonthlyBleed,
    annualized_leak: Number(annualLeak.toFixed(2)),
    translations: [
      {
        action: "Trim Inflected Services (Netflix + NYTimes)",
        monthly_saved: 39.99,
        annual_saved: 479.88,
        life_value: `Funds your '${targetGoal.name}' 2.4 months earlier, or covers 10 full organic grocery runs.`
      },
      {
        action: "Right-size AWS Cloud to baseline ($42/mo)",
        monthly_saved: 26.5,
        annual_saved: 318.0,
        life_value: "Eliminates $318/year in silent cloud drift, accelerating your Japan Travel fund by 3.2 weeks."
      },
      {
        action: "Consolidate All 3 Inflated Subscriptions",
        monthly_saved: 108.49,
        annual_saved: 1301.88,
        life_value: "Yields $1,301.88/year in guaranteed liquidity, fully covering your Credit Card Zero-Balance paydown in 16.5 months."
      }
    ]
  };
}

function computeReport() {
  const summary = computeSummary(activePeriod.month, activePeriod.year);
  return {
    period: activePeriod.label,
    report_timestamp: activePeriod.as_of_date,
    executive_verdict: summary.net_savings >= 0 ? "HEALTHY ACCUMULATION WITH CONTAINABLE LEAKS" : "DEFICIT PACING ALERT",
    verdict_badge: summary.net_savings >= 0 ? "POSITIVE" : "ATTENTION",
    net_savings_rate: `${summary.savings_rate_pct}%`,
    net_savings_amount: summary.net_savings,
    total_income: summary.total_income,
    total_expenses: summary.total_expenses,
    top_3_financial_leaks: [
      {
        rank: 1,
        title: "Dining Out Spending Overrun",
        leak_amount_mtd: 165.2,
        impact: "On pace to exceed monthly budget by $196.50 (expected to run out around Day 21 at $19.24/day)."
      },
      {
        rank: 2,
        title: "Uncontested Duplicate Billing at Whole Foods",
        leak_amount_mtd: 74.5,
        impact: "Identical charge of $74.50 on Aug 14 and Aug 15. Requires immediate bank dispute."
      },
      {
        rank: 3,
        title: "Silent Subscription Price Creep",
        leak_amount_mtd: 41.5,
        impact: "MoM price inflation on Netflix (+27.8%) and AWS (+34.3%) silently leaking $498.00 annually."
      }
    ],
    corrective_actions: [
      {
        action: "Initiate Merchant Dispute on Duplicate $74.50 Charge",
        category: "Immediate Recovery",
        expected_gain: "+$74.50 instant liquidity",
        execution_effort: "Low (1-click transaction dispute via card issuer)"
      },
      {
        action: "Enforce Dining Out Cap of $11.00/day for Remaining 12 Days",
        category: "Burn Optimization",
        expected_gain: "+$132.00 saved",
        execution_effort: "Medium (shift 4 social lunches to home meal-prep)"
      },
      {
        action: "Downgrade or Pause Creeping Subscriptions",
        category: "Structural Leak Seal",
        expected_gain: "+$39.99/month recurrent ($479.88/yr)",
        execution_effort: "Low (cancel Netflix 4K tier or pause NYTimes digital)"
      }
    ],
    cushion_buffer_status: `$${stateProfile.current_liquid_balance.toFixed(2)} liquid reserves ($${(stateProfile.current_liquid_balance - stateProfile.safety_buffer_minimum).toFixed(2)} safe headroom above $1,000 floor)`
  };
}

// -----------------------------------------------------------------------------
// REST API ENDPOINTS
// -----------------------------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "FinPilot", version: "2026.1" });
});

app.get("/api/finance/summary", (req, res) => {
  const month = req.query.month ? parseInt(req.query.month as string, 10) : activePeriod.month;
  const year = req.query.year ? parseInt(req.query.year as string, 10) : activePeriod.year;
  res.json(computeSummary(month, year));
});

app.get("/api/finance/budgets", (req, res) => {
  res.json(computeBudgets());
});

app.get("/api/finance/recurring", (req, res) => {
  res.json(computeRecurring());
});

app.get("/api/finance/anomalies", (req, res) => {
  res.json(computeAnomalies());
});

app.post("/api/finance/simulate", (req, res) => {
  const { item_name, cost, is_recurring, monthly_emi, goal_target } = req.body;
  const result = computeSimulation(
    item_name || "Proposed Purchase",
    parseFloat(cost) || 750,
    Boolean(is_recurring),
    parseFloat(monthly_emi) || 0,
    goal_target || "M4 Max Engineering Workstation"
  );
  res.json(result);
});

app.get("/api/finance/opportunity", (req, res) => {
  res.json(computeOpportunity());
});

app.get("/api/finance/report", (req, res) => {
  res.json(computeReport());
});

app.get("/api/finance/profile", (req, res) => {
  res.json({ profile: stateProfile, transactions_count: stateTransactions.length, period: activePeriod });
});

app.get("/api/finance/transactions", (req, res) => {
  res.json({ transactions: stateTransactions, period: activePeriod });
});

// CSV/TSV Ingestion endpoint with flexible schema normalization
app.post("/api/finance/ingest", (req, res) => {
  try {
    const { raw_text, file_type, filename, transactions: clientTransactions } = req.body;

    let newTransactions: Transaction[] = [];

    if (Array.isArray(clientTransactions) && clientTransactions.length > 0) {
      newTransactions = clientTransactions.map((t: any, idx: number) => ({
        id: t.id || `ingest_${Date.now()}_${idx}`,
        date: t.date || activePeriod.as_of_date,
        merchant: t.merchant || "External Merchant",
        category: categorize(t.merchant || "", t.category || ""),
        amount: Number(parseFloat(t.amount).toFixed(2)) || 0,
        type: parseFloat(t.amount) >= 0 ? "credit" : "debit",
        payment_mode: t.payment_mode || "Bank Ingestion",
        notes: t.notes || `Imported via Statement Ingestion`
      }));
    } else if (raw_text && typeof raw_text === "string") {
      const lines = raw_text.trim().split("\n");
      if (lines.length < 2) {
        return res.status(400).json({ error: "CSV/TSV must contain header and at least one row" });
      }

      const delimiter = file_type === "tsv" || (filename && filename.endsWith(".tsv")) ? "\t" : ",";
      const headers = lines[0].split(delimiter).map((h: string) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));

      const findCol = (candidates: string[]) => {
        for (const c of candidates) {
          const idx = headers.findIndex((h: string) => h.includes(c));
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const dateIdx = findCol(["date", "txn_date", "timestamp", "posted"]);
      const merchantIdx = findCol(["merchant", "vendor", "payee", "description", "name"]);
      const catIdx = findCol(["category", "type", "tag"]);
      const amtIdx = findCol(["amount", "amt", "total", "net"]);
      const debitIdx = findCol(["debit", "withdrawal", "outflow", "spent"]);
      const creditIdx = findCol(["credit", "deposit", "inflow"]);
      const modeIdx = findCol(["mode", "channel", "method", "card"]);

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(delimiter).map((p: string) => p.trim().replace(/^["']|["']$/g, ""));

        const dateVal = dateIdx !== -1 && dateIdx < parts.length ? parts[dateIdx] : "2026-09-01";
        const merchantVal = merchantIdx !== -1 && merchantIdx < parts.length ? parts[merchantIdx] : "External Merchant";
        const rawCat = catIdx !== -1 && catIdx < parts.length ? parts[catIdx] : "";
        const catVal = categorize(merchantVal, rawCat);
        const modeVal = modeIdx !== -1 && modeIdx < parts.length ? parts[modeIdx] : "Bank Ingestion";

        let amountVal = 0;
        let txType: "credit" | "debit" = "debit";

        if (debitIdx !== -1 && creditIdx !== -1) {
          const dStr = parts[debitIdx]?.replace(/[\$,]/g, "");
          const cStr = parts[creditIdx]?.replace(/[\$,]/g, "");
          if (cStr && parseFloat(cStr) > 0) {
            amountVal = parseFloat(cStr);
            txType = "credit";
          } else if (dStr && parseFloat(dStr) > 0) {
            amountVal = -Math.abs(parseFloat(dStr));
            txType = "debit";
          }
        } else if (amtIdx !== -1 && amtIdx < parts.length) {
          const parsed = parseFloat(parts[amtIdx].replace(/[\$,]/g, ""));
          if (!isNaN(parsed)) {
            amountVal = parsed;
            txType = parsed >= 0 ? "credit" : "debit";
          }
        }

        newTransactions.push({
          id: `ingest_${Date.now()}_${i}`,
          date: dateVal,
          merchant: merchantVal,
          category: catVal,
          amount: Number(amountVal.toFixed(2)),
          type: txType,
          payment_mode: modeVal,
          notes: `Imported via Statement Ingestion`
        });
      }
    } else {
      return res.status(400).json({ error: "No transactions or raw_text provided" });
    }

    if (newTransactions.length === 0) {
      return res.status(400).json({ error: "Could not parse any valid transactions from file" });
    }

    // Determine statement period from transaction dates
    const dateCounts: Record<string, number> = {};
    const validDates: string[] = [];
    for (const t of newTransactions) {
      const match = t.date.match(/^(\d{4})-(\d{1,2})/);
      if (match) {
        const ym = `${match[1]}-${match[2].padStart(2, "0")}`;
        dateCounts[ym] = (dateCounts[ym] || 0) + 1;
        validDates.push(t.date);
      }
    }

    let detectedYear = 2026;
    let detectedMonth = 9;
    if (Object.keys(dateCounts).length > 0) {
      const topYm = Object.entries(dateCounts).sort((a, b) => b[1] - a[1])[0][0];
      const [y, m] = topYm.split("-");
      detectedYear = parseInt(y, 10);
      detectedMonth = parseInt(m, 10);
    }

    const latestDate = validDates.sort().reverse()[0] || `${detectedYear}-${String(detectedMonth).padStart(2, "0")}-15`;
    const periodLabel = `${MONTH_NAMES[detectedMonth - 1]} ${detectedYear}`;

    // Calculate core metrics for the new statement:
    // Money In = Total credited deposits
    const totalDeposits = newTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    // Money Spent = Total debited expenses
    const totalDebits = newTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Leftover Cash = Money In - Money Spent
    const leftoverCash = totalDeposits - totalDebits;

    // Recalculate bank balance and emergency cushion headroom:
    // Emergency Cushion = Current bank balance minus the safety floor target
    const safetyFloor = stateProfile.safety_buffer_minimum;
    const newBankBalance = Number((safetyFloor + Math.max(0, leftoverCash)).toFixed(2));
    stateProfile.current_liquid_balance = newBankBalance;

    // Update active period metadata
    activePeriod = {
      month: detectedMonth,
      year: detectedYear,
      label: periodLabel,
      as_of_date: latestDate,
      filename: filename || "uploaded_statement.csv"
    };

    // Re-initialize active transactions state with the uploaded dataset
    stateTransactions = newTransactions;

    // Recalculate summary from the fresh transactions
    const summary = computeSummary(detectedMonth, detectedYear);

    res.json({
      status: "success",
      ingested_count: newTransactions.length,
      period: periodLabel,
      period_label: periodLabel,
      filename: activePeriod.filename,
      summary,
      sample: newTransactions.slice(0, 3)
    });
  } catch (err: any) {
    console.error("Ingest error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Reset endpoint to reload mock data
app.post("/api/finance/reset", (req, res) => {
  stateTransactions = [...INITIAL_TRANSACTIONS];
  stateProfile = { ...INITIAL_PROFILE };
  activePeriod = {
    month: 8,
    year: 2026,
    label: "August 2026",
    as_of_date: "2026-08-19",
    filename: "sample_august_2026.csv"
  };
  const summary = computeSummary(8, 2026);
  res.json({
    status: "success",
    message: "Reset to August 2026 baseline dataset",
    period_label: "August 2026",
    summary
  });
});

// Python Code Inspector API
app.get("/api/finance/python-code", (req, res) => {
  try {
    const mockDataCode = fs.readFileSync(path.join(process.cwd(), "mock_data.py"), "utf-8");
    const toolsCode = fs.readFileSync(path.join(process.cwd(), "tools.py"), "utf-8");
    const agentCode = fs.readFileSync(path.join(process.cwd(), "agent.py"), "utf-8");
    const appCode = fs.readFileSync(path.join(process.cwd(), "app.py"), "utf-8");

    res.json({
      "mock_data.py": mockDataCode,
      "tools.py": toolsCode,
      "agent.py": agentCode,
      "app.py": appCode
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to read Python files: " + err.message });
  }
});

// Autonomous Decision Agent API with Internal Audit Loop
app.post("/api/finance/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const queryLower = message.toLowerCase();

  // Step 1: Autonomous Intent Identification & Deterministic Tool Selection
  let toolName = "get_monthly_summary";
  let toolArgs: Record<string, any> = {};
  let thoughtProcess = "";

  if (["afford", "buy", "purchase", "spend", "cost", "emi", "can i"].some((k) => queryLower.includes(k))) {
    toolName = "simulate_purchase";
    // Extract numerical cost
    const match = message.match(/\$?(\d+(?:\.\d+)?)/);
    const cost = match ? parseFloat(match[1]) : 750;
    let item = "High-Performance Purchase";
    if (queryLower.includes("laptop")) item = "M4 Max Engineering Laptop";
    else if (queryLower.includes("gym")) item = "Gym Membership";
    else if (queryLower.includes("trip") || queryLower.includes("travel")) item = "Japan Travel Reservation";

    toolArgs = {
      item_name: item,
      cost,
      is_recurring: queryLower.includes("emi") || queryLower.includes("month"),
      monthly_emi: queryLower.includes("emi") ? cost : 0
    };
    thoughtProcess = `User is posing a counterfactual decision query regarding purchasing '${item}' for $${cost.toFixed(2)}. Invoking deterministic simulate_purchase to calculate stress test against safety buffer floor.`;
  } else if (["subscription", "recurring", "bleed", "stream", "netflix", "creep", "inflation"].some((k) => queryLower.includes(k))) {
    toolName = "detect_recurring_and_subscriptions";
    thoughtProcess = "Inquiry requires recurring obligation and price creep detection. Invoking detect_recurring_and_subscriptions for MoM inflation delta and upcoming commitments.";
  } else if (["anomaly", "unusual", "duplicate", "spike", "fraud", "error", "outlier"].some((k) => queryLower.includes(k))) {
    toolName = "detect_anomalies";
    thoughtProcess = "User requests transaction audit for statistical outliers and duplicates. Invoking detect_anomalies for >1.75 SD spikes, 48h duplicates, and first-time merchants.";
  } else if (["budget", "velocity", "limit", "category", "dining out", "burn"].some((k) => queryLower.includes(k))) {
    toolName = "compare_budgets";
    thoughtProcess = "User asks about budget pace and category burn rate. Invoking compare_budgets to calculate spend pace and estimate when budget limits run out.";
  } else if (["report", "executive", "summary", "verdict", "eom"].some((k) => queryLower.includes(k))) {
    toolName = "generate_executive_report";
    thoughtProcess = "User requests an executive brief. Invoking generate_executive_report for net savings rate, top 3 financial leaks, and non-judgmental corrective actions.";
  } else if (["opportunity", "value", "cancel", "laptop", "trade-off", "translate"].some((k) => queryLower.includes(k))) {
    toolName = "calculate_opportunity_cost";
    thoughtProcess = "User wants to explore subscription opportunity cost. Invoking calculate_opportunity_cost to project milestone completion acceleration.";
  } else {
    toolName = "get_monthly_summary";
    thoughtProcess = `User requests general financial situation. Invoking get_monthly_summary for ${activePeriod.label} ground-truth income, expenses, and savings rate.`;
  }

  // Step 2: Deterministic Tool Dispatch
  let mathObservation: any = null;
  if (toolName === "simulate_purchase") {
    mathObservation = computeSimulation(toolArgs.item_name, toolArgs.cost, toolArgs.is_recurring, toolArgs.monthly_emi);
  } else if (toolName === "detect_recurring_and_subscriptions") {
    mathObservation = computeRecurring();
  } else if (toolName === "detect_anomalies") {
    mathObservation = computeAnomalies();
  } else if (toolName === "compare_budgets") {
    mathObservation = computeBudgets();
  } else if (toolName === "generate_executive_report") {
    mathObservation = computeReport();
  } else if (toolName === "calculate_opportunity_cost") {
    mathObservation = computeOpportunity();
  } else {
    mathObservation = computeSummary(activePeriod.month, activePeriod.year);
  }

  // Step 3: Synthesis with Gemini (or Deterministic fallback)
  let synthesizedRecommendation = "";
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `You are FinPilot, a helpful, down-to-earth personal finance companion.
Speak like a smart, warm friend helping with everyday money decisions—never sound robotic, academic, or condescending.

CRITICAL DIRECTIVES:
1. Direct Answer First: When answering purchase or affordability questions, state your verdict clearly in sentence 1 (e.g., "Yes, you can comfortably afford this right now." or "Hold off for now—this will dip into your emergency cushion.").
2. Everyday Language: Strictly avoid financial or technical jargon. Do NOT say "latent space", "deterministic core", "MTD outflows", "breach", "counterfactual simulation", "z-score", or "safety buffer headroom". Instead use "money in", "money spent", "leftover cash", "emergency cushion", and "over budget".
3. No Raw Code: Never show raw code, JSON payloads, or function calls in your message.
4. Grounded in Math: Keep all calculations strictly aligned with the computed numbers provided below.
5. Actionable Advice: Provide 2 to 3 concise, practical bullet points on what to do next.
6. Active Statement Period: The current active statement is for ${activePeriod.label} (filename: ${activePeriod.filename}).

User Question: "${message}"
Tool Executed: "${toolName}"
Tool Arguments: ${JSON.stringify(toolArgs)}
Computed Math: ${JSON.stringify(mathObservation)}

Synthesize a friendly, empowering, and crisp response.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt
      });

      synthesizedRecommendation = response.text || "";
    } catch (e: any) {
      console.warn("Gemini API fallback to friendly deterministic synthesis:", e.message);
    }
  }

  // Fallback friendly deterministic synthesis if Gemini is unavailable or failed
  if (!synthesizedRecommendation) {
    if (toolName === "simulate_purchase") {
      const v = mathObservation.verdict;
      const costStr = `$${mathObservation.immediate_deduction.toFixed(2)}`;
      const cushionStr = `$${mathObservation.buffer_headroom.toFixed(2)}`;
      
      if (v === "APPROVED") {
        synthesizedRecommendation = `Yes, you can comfortably afford this ${toolArgs.item_name || "purchase"} right now.\n\nAfter paying ${costStr} and setting aside money for all bills due before your next paycheck, you'll still have **${cushionStr} in spare cash** above your $1,000 emergency cushion.\n\n**Here's how to make it seamless:**\n- **Pay in full**: You have plenty of cash on hand, so avoiding installments or financing interest is your best bet.\n- **Stay the course**: Keep your dining out in check for the rest of the month so you don't eat into this cushion.\n- **Goal on track**: You're still on schedule to hit your laptop savings goal by late November!`;
      } else if (v === "CONDITIONAL") {
        synthesizedRecommendation = `You can buy this, but you'll need to trim spending in another category to stay comfortable.\n\nThis ${costStr} purchase leaves you with about **${cushionStr} above your emergency cushion**, which is getting close to the line.\n\n**Recommended plan:**\n- **Trim flexible spending**: Cut dining out or shopping by $60 over the next two weeks to offset the cost.\n- **Dispute the duplicate charge**: Dispute the $74.50 duplicate charge at Whole Foods to immediately recoup cash.\n- **Pause 1 subscription**: Pausing an unused streaming service frees up extra breathing room right away.`;
      } else {
        synthesizedRecommendation = `Hold off for now—buying this would dip directly into your $1,000 emergency cushion.\n\nSpending ${costStr} right now would leave you **$${Math.abs(mathObservation.buffer_headroom).toFixed(2)} below your safety cushion** once your upcoming bills (like rent) hit before payday.\n\n**How to get there safely:**\n- **Wait until next payday**: Your next paycheck arrives Sept 1, which will replenish your checking account.\n- **Save $150 over the next 2 weeks**: By cutting back on dining out, you'll be able to buy this in September without stressing your cushion.\n- **Dispute recent errors**: Clear up the $74.50 duplicate charge to boost your starting balance.`;
      }
    } else if (toolName === "detect_recurring_and_subscriptions") {
      const alerts = mathObservation.inflation_alerts.map((l: any) => `• **${l.merchant}**: Crept from $${l.old_price.toFixed(2)} to $${l.new_price.toFixed(2)}/mo (+${l.pct_increase}%). That's an extra **$${l.annualized_leak.toFixed(2)} a year** without any notice.`).join("\n");
      synthesizedRecommendation = `You currently have **${mathObservation.active_subscriptions_count} active subscriptions** costing you **$${mathObservation.total_monthly_recurring.toFixed(2)} each month**.\n\n⚠️ **Heads up on silent price increases:**\n${alerts}\n\n**Upcoming bills to plan for:**\n- **Next 15 Days**: $${mathObservation.committed_obligations.next_15_days.toFixed(2)} (includes Rent on Sept 1, gym, and electric)\n- **Next 30 Days**: $${mathObservation.committed_obligations.next_30_days.toFixed(2)}\n\n**Quick tip**: Canceling just the Netflix 4K tier and pausing NYTimes puts **$39.99/month ($480/year)** right back in your pocket!`;
    } else if (toolName === "detect_anomalies") {
      synthesizedRecommendation = `We spotted a few unusual charges that deserve your attention:\n\n1. **Duplicate charge at Whole Foods ($74.50)**: You were billed twice within 48 hours for the exact same amount. You should dispute this with your bank to get that $74.50 back.\n2. **High medical bill at Apex Dental ($450.00)**: This is much higher than your normal health spending, but looks like a legitimate one-off appointment.\n3. **First-time purchase at NordicTech ($389.00)**: A new tech merchant that's significantly higher than your typical shopping run.\n\n**Recommended next steps:**\n- Tap **Dispute This Charge** on Whole Foods to reclaim your $74.50.\n- Keep receipts for your dental work for health savings reimbursement.`;
    } else if (toolName === "compare_budgets") {
      synthesizedRecommendation = `You've spent **$${mathObservation.overall_spent_mtd.toFixed(2)}** of your **$${mathObservation.overall_budget.toFixed(2)}** monthly budget so far (Day ${mathObservation.days_elapsed} of ${mathObservation.days_in_month}).\n\nOverall you're doing well at **${mathObservation.overall_consumed_pct}% spent**, but here's the category to watch:\n\n⚠️ **Dining Out is burning fast**: You've spent $365.50 of your $400 budget in just 19 days (91%). At this pace, you'll be over budget by **August 21** and end the month at nearly $600.\n\n**How to stay on budget:**\n- Aim for $11/day or less on dining out for the remaining 12 days of August.\n- Cook 3 or 4 dinners at home this week to easily lock in $80 in savings.`;
    } else if (toolName === "generate_executive_report") {
      synthesizedRecommendation = `Your finances are in **solid shape** this month with a healthy savings cushion.\n\n- **Money In**: $${mathObservation.total_income.toFixed(2)}\n- **Money Spent**: $${mathObservation.total_expenses.toFixed(2)}\n- **Leftover Cash**: **$${mathObservation.net_savings_amount.toFixed(2)}** (that's a **${mathObservation.net_savings_rate}** savings rate!)\n- **Emergency Cushion**: You have **+$2,450 in safe cash** above your $1,000 cushion.\n\n**Top 3 opportunities to keep more money:**\n1. **Dispute Whole Foods duplicate**: Reclaim **$74.50** with 1 click.\n2. **Slow down dining out**: Cap eating out to save ~$165 by month's end.\n3. **Trim creeping subscriptions**: Drop Netflix 4K and unused cloud servers to save **$480/year**.`;
    } else if (toolName === "calculate_opportunity_cost") {
      synthesizedRecommendation = `Trimming your unused subscriptions can make a huge dent in your **${mathObservation.target_goal}**!\n\nYou're currently spending **$${mathObservation.total_subscription_bleed_monthly.toFixed(2)}/month ($${mathObservation.annualized_leak.toFixed(2)}/year)** across recurring services.\n\n**Here's what redirecting that money does for your real life:**\n- **Drop Netflix 4K & NYTimes** (saves $39.99/mo) ➔ You'll hit your laptop goal **2.4 months earlier**.\n- **Right-size AWS servers** (saves $26.50/mo) ➔ Frees up an extra $318/year toward your autumn Japan trip.\n- **Trim all 3 leaks** (saves $108.49/mo) ➔ Completely wipes out high-interest credit card balances in 16 months!`;
    } else {
      synthesizedRecommendation = `Here is where your money stands for ${activePeriod.label}:\n\n- **Money In**: $${mathObservation.total_income.toFixed(2)} (${mathObservation.deposit_count ?? 2} deposits)\n- **Money Spent**: $${mathObservation.total_expenses.toFixed(2)} ($${mathObservation.daily_burn_rate.toFixed(2)} per day)\n- **Leftover Cash**: **$${mathObservation.net_savings.toFixed(2)}** (saving **${mathObservation.savings_rate_pct}%** of your income)\n- **Emergency Cushion**: You have **$${mathObservation.buffer_headroom.toFixed(2)} in safe cushion** above your $${mathObservation.safety_buffer_minimum.toFixed(0)} floor.\n\n**Next step**: What would you like to check? You can ask about a purchase you're considering, look at your subscriptions, or check for any unusual charges.`;
    }
  }

  // Return Complete 4-Step Internal Audit Loop
  res.json({
    query: message,
    thought_process: thoughtProcess,
    tool_invocation: {
      tool: toolName,
      parameters: toolArgs
    },
    mathematical_observation: mathObservation,
    synthesized_recommendation: synthesizedRecommendation
  });
});

// -----------------------------------------------------------------------------
// VITE MIDDLEWARE & STATIC SERVING
// -----------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FinPilot Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
