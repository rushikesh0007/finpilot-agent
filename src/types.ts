export interface MonthlySummary {
  period: string;
  as_of_date: string;
  days_elapsed: number;
  days_in_month: number;
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate_pct: number;
  daily_burn_rate: number;
  projected_month_end_expense: number;
  current_liquid_balance: number;
  safety_buffer_minimum: number;
  buffer_headroom: number;
  category_totals: Record<string, number>;
  period_label?: string;
  deposit_count?: number;
  expense_count?: number;
}

export interface BudgetCategory {
  category: string;
  budget_limit: number;
  spent_mtd: number;
  consumed_pct: number;
  remaining_headroom: number;
  daily_burn: number;
  projected_month_end: number;
  velocity_pct: number;
  status: "HEALTHY" | "WATCH" | "RUNS_OUT_SOON" | "OVER_BUDGET" | "BREACH_PROJECTED" | "BREACHED" | string;
  alert_color: "green" | "amber" | "red" | string;
  projected_breach_day: number | null;
  projected_runout_day?: number | null;
}

export interface BudgetComparison {
  days_elapsed: number;
  days_in_month: number;
  overall_budget: number;
  overall_spent_mtd: number;
  overall_consumed_pct: number;
  categories: BudgetCategory[];
}

export interface SubscriptionItem {
  merchant: string;
  category: string;
  cadence: string;
  current_amount: number;
  previous_amount: number;
  pct_change_mom: number;
  is_inflated: boolean;
  next_due_date: string;
}

export interface InflationAlert {
  merchant: string;
  old_price: number;
  new_price: number;
  pct_increase: number;
  annualized_leak: number;
  description: string;
}

export interface CommittedObligations {
  next_15_days: number;
  next_30_days: number;
  next_60_days: number;
}

export interface RecurringAnalysis {
  total_monthly_recurring: number;
  active_subscriptions_count: number;
  subscriptions: SubscriptionItem[];
  inflation_alerts: InflationAlert[];
  committed_obligations: CommittedObligations;
}

export interface StatisticalSpike {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  category_mean: number;
  z_score: number;
  reason: string;
}

export interface DuplicateCharge {
  original_tx: { id: string; date: string; merchant: string; amount: number };
  duplicate_tx: { id: string; date: string; merchant: string; amount: number };
  merchant: string;
  amount: number;
  window_hours: number;
  reason: string;
}

export interface FirstTimeMerchant {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  daily_average_baseline: number;
  reason: string;
}

export interface AnomalyReport {
  total_anomalies_flagged: number;
  statistical_spikes: StatisticalSpike[];
  duplicate_charges: DuplicateCharge[];
  first_time_spikes: FirstTimeMerchant[];
}

export interface GoalImpact {
  goal_name: string;
  target_amount: number;
  current_amount: number;
  trajectory_delay_days: number;
  summary: string;
}

export interface SimulationResult {
  item_name: string;
  cost: number;
  is_recurring: boolean;
  immediate_deduction: number;
  current_liquid_balance: number;
  upcoming_fixed_commitments_pre_pay: number;
  projected_liquidity: number;
  safety_buffer_minimum: number;
  buffer_headroom: number;
  verdict: "APPROVED" | "CONDITIONAL" | "HIGH RISK";
  verdict_color: "green" | "amber" | "red";
  explanation: string;
  remediation_condition: string;
  goal_impact?: GoalImpact;
  stress_test_steps: {
    Step_A_Project_Obligations: string;
    Step_B_Deduct_Proposed: string;
    Step_C_Check_Liquidity: string;
    Step_D_Deterministic_Verdict: string;
  };
}

export interface OpportunityTranslation {
  action: string;
  monthly_saved: number;
  annual_saved: number;
  life_value: string;
}

export interface OpportunityCostResult {
  target_goal: string;
  target_remaining: number;
  total_subscription_bleed_monthly: number;
  annualized_leak: number;
  translations: OpportunityTranslation[];
}

export interface FinancialLeak {
  rank: number;
  title: string;
  leak_amount_mtd: number;
  impact: string;
}

export interface CorrectiveAction {
  action: string;
  category: string;
  expected_gain: string;
  execution_effort: string;
}

export interface ExecutiveReport {
  period: string;
  report_timestamp: string;
  executive_verdict: string;
  verdict_badge: string;
  net_savings_rate: string;
  net_savings_amount: number;
  total_income: number;
  total_expenses: number;
  top_3_financial_leaks: FinancialLeak[];
  corrective_actions: CorrectiveAction[];
  cushion_buffer_status: string;
}

export interface AuditTrace {
  query: string;
  thought_process: string;
  tool_invocation: {
    tool: string;
    parameters: Record<string, any>;
  };
  mathematical_observation: any;
  synthesized_recommendation: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  trace?: AuditTrace;
  timestamp: string;
}
