"""
app.py - Reactive Streamlit Dashboard for FinPilot
AI Agent Hackathon 2026 - Autonomous Personal Finance Decision-Support Agent
"""

import streamlit as st
import json
import calendar
from datetime import datetime
from tools import FinanceEngine
from agent import FinPilotAgent
from mock_data import RAW_TRANSACTIONS, USER_PROFILE, CURRENT_DATE_STR

try:
    import pandas as pd
except ImportError:
    # Fail-safe lightweight compatibility layer if pandas is not present
    class SimpleSeries(list):
        def sum(self):
            return sum(float(x) for x in self if x is not None)
        def abs(self):
            return SimpleSeries([abs(float(x)) for x in self if x is not None])
        def astype(self, _):
            return self
        def dropna(self):
            return SimpleSeries([x for x in self if x is not None and str(x) != "nan"])
        @property
        def iloc(self):
            class ILoc:
                def __init__(self, s): self.s = s
                def __getitem__(self, idx): return self.s[idx]
            return ILoc(self)

    class SimpleDataFrame:
        def __init__(self, records=None):
            if isinstance(records, dict):
                self._records = []
            elif isinstance(records, list):
                self._records = [dict(r) for r in records]
            else:
                self._records = []
            self.columns = list(self._records[0].keys()) if self._records else []
            self.empty = len(self._records) == 0

        def to_dict(self, orient="records"):
            return [dict(r) for r in self._records]

        def __len__(self):
            return len(self._records)

        def __getitem__(self, item):
            if isinstance(item, str):
                return SimpleSeries([r.get(item, None) for r in self._records])
            elif isinstance(item, list):
                filtered = [r for r, keep in zip(self._records, item) if keep]
                return SimpleDataFrame(filtered)
            return self._records[item]

        def __setitem__(self, key, value):
            if isinstance(value, (list, SimpleSeries)):
                for r, v in zip(self._records, value):
                    r[key] = v
            else:
                for r in self._records:
                    r[key] = value

    class PDCompat:
        DataFrame = SimpleDataFrame
        def to_numeric(self, series, errors="coerce"):
            nums = []
            for s in series:
                try:
                    nums.append(float(s))
                except Exception:
                    nums.append(0.0)
            return SimpleSeries(nums)
    pd = PDCompat()

# Configure Page
st.set_page_config(
    page_title="FinPilot | Autonomous Personal Finance Agent",
    page_icon="🧭",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 1. Initialize Active Transactions DataFrame in Session State
if "transactions_df" not in st.session_state:
    st.session_state.transactions_df = pd.DataFrame(RAW_TRANSACTIONS)

if "engine" not in st.session_state:
    initial_records = (
        st.session_state.transactions_df.to_dict("records")
        if hasattr(st.session_state.transactions_df, "to_dict")
        else list(st.session_state.transactions_df)
    )
    st.session_state.engine = FinanceEngine(transactions=initial_records)

if "agent" not in st.session_state:
    st.session_state.agent = FinPilotAgent(st.session_state.engine)

if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "assistant",
            "content": "👋 Welcome to **FinPilot**! I am your autonomous financial decision-support agent.\nI provide mathematically audited simulations, subscription inflation alerts, and counterfactual decision guardrails.\n\nTry asking: *'Can I buy a $750 laptop?'* or *'Which subscriptions increased?'*",
            "trace": None
        }
    ]

# --- Sidebar: Ingestion & Controls ---
with st.sidebar:
    st.title("🧭 FinPilot Controls")
    st.caption("AI Agent Hackathon 2026 • Autonomous Decision Support")
    
    st.subheader("Data Normalization & Ingestion")
    uploaded_file = st.file_uploader("Upload Bank/Card Export (CSV/TSV)", type=["csv", "tsv"], key="file_uploader")
    if uploaded_file is not None:
        file_signature = f"{uploaded_file.name}_{uploaded_file.size}"
        if st.session_state.get("last_uploaded_signature") != file_signature:
            raw_text = uploaded_file.getvalue().decode("utf-8")
            ext = "tsv" if uploaded_file.name.endswith(".tsv") else "csv"

            # Parse file with normalization engine
            temp_engine = FinanceEngine(transactions=[])
            res = temp_engine.normalize_and_ingest(raw_text, file_type=ext)

            if res["status"] == "success" and temp_engine.transactions:
                # Update st.session_state.transactions_df with newly parsed transactions
                new_df = pd.DataFrame(temp_engine.transactions)
                st.session_state.transactions_df = new_df
                st.session_state.last_uploaded_signature = file_signature

                # Re-initialize the finance calculation engine with this new data
                new_records = (
                    new_df.to_dict("records")
                    if hasattr(new_df, "to_dict")
                    else list(new_df)
                )
                new_engine = FinanceEngine(transactions=new_records)

                # Update liquid balance based on uploaded statement cash flow
                total_in_val = sum(float(r["amount"]) for r in new_records if float(r.get("amount", 0)) > 0)
                total_out_val = sum(abs(float(r["amount"])) for r in new_records if float(r.get("amount", 0)) < 0)
                net_savings_val = total_in_val - total_out_val
                safety_floor = float(new_engine.profile.get("safety_buffer_minimum", 1000.0))
                new_engine.profile["current_liquid_balance"] = round(safety_floor + max(0.0, net_savings_val), 2)

                st.session_state.engine = new_engine
                st.session_state.agent = FinPilotAgent(new_engine)
                st.session_state.uploaded_success_msg = f"Ingested {res['ingested_count']} transactions with dynamic column normalization!"

                # Trigger immediate rerun
                if hasattr(st, "rerun"):
                    st.rerun()
                elif hasattr(st, "experimental_rerun"):
                    st.experimental_rerun()
            else:
                st.error(res.get("message", "Error parsing statement file."))

    if st.session_state.get("uploaded_success_msg"):
        st.success(st.session_state.pop("uploaded_success_msg"))

    if st.button("🔄 Reset to Baseline (August 2026)", use_container_width=True):
        st.session_state.transactions_df = pd.DataFrame(RAW_TRANSACTIONS)
        st.session_state.engine = FinanceEngine(transactions=RAW_TRANSACTIONS)
        st.session_state.agent = FinPilotAgent(st.session_state.engine)
        st.session_state.last_uploaded_signature = None
        if hasattr(st, "rerun"):
            st.rerun()
        elif hasattr(st, "experimental_rerun"):
            st.experimental_rerun()

    st.divider()
    st.subheader("Safety Cushion & Targets")
    st.metric("Liquid Reserves", f"${st.session_state.engine.profile['current_liquid_balance']:,.2f}")
    st.metric("Safety Buffer Minimum", f"${st.session_state.engine.profile['safety_buffer_minimum']:,.2f}")
    st.metric("Next Paycheck", st.session_state.engine.profile["next_paycheck_date"])

    st.divider()
    if st.button("Generate 1-Click Executive Report", use_container_width=True):
        st.session_state.show_report = True

# -----------------------------------------------------------------------------
# Reactive Metrics Aggregation computed directly from st.session_state.transactions_df
# -----------------------------------------------------------------------------
df = st.session_state.transactions_df
engine = st.session_state.engine
agent = st.session_state.agent

# Standardize records from transactions_df
records = df.to_dict("records") if hasattr(df, "to_dict") else [dict(r) for r in df]

# Dynamically derive the date badge/month header from the date column of active DataFrame
dates = [str(r.get("date", "")) for r in records if r.get("date")]
ym_counts = {}
for d in dates:
    if len(d) >= 7 and d[4] == "-":
        ym = d[:7]
        ym_counts[ym] = ym_counts.get(ym, 0) + 1

if ym_counts:
    active_ym = sorted(ym_counts.items(), key=lambda x: x[1], reverse=True)[0][0]
    active_year, active_month = int(active_ym[:4]), int(active_ym[5:7])
else:
    active_year, active_month = 2026, 8
    active_ym = "2026-08"

month_name = calendar.month_name[active_month] if (1 <= active_month <= 12) else "August"
period_label = f"{month_name} {active_year}"

# Isolate records for active period
month_records = [r for r in records if str(r.get("date", "")).startswith(active_ym)]
if not month_records:
    month_records = records

month_dates = sorted([str(r.get("date", "")) for r in month_records if r.get("date")], reverse=True)
latest_date_str = month_dates[0] if month_dates else f"{active_year}-{active_month:02d}-15"
try:
    days_elapsed = int(latest_date_str.split("-")[2])
except Exception:
    days_elapsed = 19
days_in_month = calendar.monthrange(active_year, active_month)[1]

# 1. Total Income: reactive sum of all inflows (amount > 0)
income_txs = [r for r in month_records if float(r.get("amount", 0)) > 0]
total_income = sum(float(r["amount"]) for r in income_txs)
deposit_count = len(income_txs)
last_income = sorted(income_txs, key=lambda x: str(x.get("date", "")), reverse=True)[0] if income_txs else None
if last_income:
    income_sub = f"+${float(last_income['amount']):,.2f} on {last_income['date']}"
else:
    income_sub = f"{deposit_count} credited deposit{'s' if deposit_count != 1 else ''}"

# 2. Total Expenses: reactive sum of all outflows (amount < 0)
expense_txs = [r for r in month_records if float(r.get("amount", 0)) < 0]
total_expenses = sum(abs(float(r["amount"])) for r in expense_txs)
daily_burn = (total_expenses / days_elapsed) if days_elapsed > 0 else 0.0

# 3. Net Savings Rate: (Total Income - Total Expenses) / Total Income
net_savings = total_income - total_expenses
savings_rate_pct = round((net_savings / total_income * 100.0), 2) if total_income > 0 else 0.0
savings_sub = f"${net_savings:,.2f} surplus" if net_savings >= 0 else f"-${abs(net_savings):,.2f} deficit"

# 4. Buffer Headroom: Liquid Reserves - Safety Buffer Minimum
safety_buffer = float(engine.profile.get("safety_buffer_minimum", 1000.0))
liquid_balance = float(engine.profile.get("current_liquid_balance", safety_buffer + max(0.0, net_savings)))
buffer_headroom = round(liquid_balance - safety_buffer, 2)

# --- Main Dashboard Header ---
st.title("FinPilot: Autonomous Financial Decision-Support Agent")
st.markdown(f"**Active Statement Period**: `{period_label}` (As of {latest_date_str}) • *Mathematical determinism in the tools • Autonomous cognitive reasoning in the orchestrator*")

# Top Metric Cards directly bound to reactive aggregations computed from st.session_state.transactions_df
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric("Total Income (MTD)", f"${total_income:,.2f}", income_sub)
with col2:
    st.metric("Total Expenses (MTD)", f"${total_expenses:,.2f}", f"Avg ${daily_burn:,.2f}/day • Day {days_elapsed} of {days_in_month}")
with col3:
    st.metric("Net Savings Rate", f"{savings_rate_pct:.2f}%", savings_sub)
with col4:
    st.metric("Buffer Headroom", f"${buffer_headroom:,.2f}", f"Above ${safety_buffer:,.0f} Safety Floor", delta_color="normal")

st.divider()

# Fetch Real-time Engine Metrics for Active Period
summary = engine.get_monthly_summary(month=active_month, year=active_year)
budgets = engine.compare_budgets()
anomalies = engine.detect_anomalies()
recurring = engine.detect_recurring_and_subscriptions()
opportunity = engine.calculate_opportunity_cost()

st.divider()

# Tab Layout: Decision Cockpit, Subscriptions & Anomalies, Life Value Translator, and Audit Agent
tab_chat, tab_budgets, tab_subs, tab_anomalies, tab_translator = st.tabs([
    "💬 Decision Agent & Simulator",
    "📊 Dynamic Budgets & Velocity",
    "🔄 Subscriptions & Silent Inflation",
    "🚨 Statistical Anomalies",
    "🌱 Life Value Translator"
])

# --- TAB 1: Decision Agent & Simulator ---
with tab_chat:
    st.subheader("Counterfactual Decision Guardrail & Natural Language Q&A")
    st.caption("Ask questions with guaranteed zero latent arithmetic. Every answer is backed by an internal audit loop.")

    # Pre-loaded prompt triggers
    col_p1, col_p2, col_p3, col_p4 = st.columns(4)
    with col_p1:
        if st.button("Can I buy a $750 laptop?"):
            st.session_state.prompt_input = "Can I buy a $750 laptop?"
    with col_p2:
        if st.button("Which subscriptions increased?"):
            st.session_state.prompt_input = "Which subscriptions increased?"
    with col_p3:
        if st.button("Audit my financial leaks"):
            st.session_state.prompt_input = "Audit my financial leaks"
    with col_p4:
        if st.button("Simulate $80/mo Gym EMI"):
            st.session_state.prompt_input = "Can I take on an $80/month EMI?"

    # Render Chat History
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    # Chat Input
    user_prompt = st.chat_input("Ask FinPilot a decision question...")
    if "prompt_input" in st.session_state:
        user_prompt = st.session_state.pop("prompt_input")

    if user_prompt:
        st.session_state.messages.append({"role": "user", "content": user_prompt})
        with st.chat_message("user"):
            st.markdown(user_prompt)

        with st.chat_message("assistant"):
            with st.spinner("FinPilot is calculating the numbers..."):
                result = agent.process_query(user_prompt)
            st.markdown(result["synthesized_recommendation"])

        st.session_state.messages.append({
            "role": "assistant",
            "content": result["synthesized_recommendation"]
        })

# --- TAB 2: Dynamic Budgets & Velocity ---
with tab_budgets:
    st.subheader("Dynamic Budget vs. Actual Variance & Spend Velocity")
    st.markdown(f"Current Day: **Day {budgets['days_elapsed']} of {budgets['days_in_month']}**. Spend velocity calculates whether current burn rate will breach end-of-month allocations.")
    
    for cat in budgets["categories"]:
        col_b1, col_b2, col_b3 = st.columns([3, 5, 2])
        with col_b1:
            st.markdown(f"**{cat['category']}**")
            st.caption(f"Spent: ${cat['spent_mtd']:,.2f} / Limit: ${cat['budget_limit']:,.2f}")
        with col_b2:
            progress_val = min(cat["consumed_pct"] / 100.0, 1.0)
            st.progress(progress_val)
            if cat["status"] == "BREACHED":
                st.caption(f"🚨 **BREACHED** by ${abs(cat['remaining_headroom']):,.2f}")
            elif cat["status"] == "BREACH_PROJECTED":
                st.caption(f"⚠️ **Velocity Alert**: {cat['velocity_pct']}% velocity. Projected breach on **Day {cat['projected_breach_day']}** (${cat['projected_month_end']:,.2f} projected)")
            else:
                st.caption(f"✅ On track ({cat['consumed_pct']}%) • Remainder: ${cat['remaining_headroom']:,.2f}")
        with col_b3:
            st.metric("Daily Burn", f"${cat['daily_burn']:,.2f}/day")
        st.divider()

# --- TAB 3: Subscriptions & Silent Inflation ---
with tab_subs:
    st.subheader("Recurring Obligations & Silent Subscription Inflation")
    st.markdown(f"**{recurring['active_subscriptions_count']} Active Subscriptions** • Total Monthly Run-rate: **${recurring['total_monthly_recurring']:,.2f}/mo**")

    st.markdown("#### 🚨 Silent Subscription Inflation Alerts")
    for alert in recurring["inflation_alerts"]:
        st.warning(f"**{alert['merchant']}**: {alert['description']} — Leaking **${alert['annualized_leak']:,.2f}/year** without explicit notification!")

    st.markdown("#### 📅 Committed Obligations Forecast")
    c1, c2, c3 = st.columns(3)
    c1.metric("Next 15 Days", f"${recurring['committed_obligations']['next_15_days']:,.2f}", "Includes rent & early bills")
    c2.metric("Next 30 Days", f"${recurring['committed_obligations']['next_30_days']:,.2f}", "Full monthly fixed commitments")
    c3.metric("Next 60 Days", f"${recurring['committed_obligations']['next_60_days']:,.2f}", "2-month horizon reserve needed")

    st.markdown("#### All Active Services")
    st.dataframe(recurring["subscriptions"], use_container_width=True)

# --- TAB 4: Statistical Anomalies ---
with tab_anomalies:
    st.subheader("Statistical Outlier & Anomaly Detection")
    st.markdown(f"**{anomalies['total_anomalies_flagged']} Suspicious Events Detected** using rigorous statistical variance and temporal windows.")

    if anomalies["duplicate_charges"]:
        st.error("### ⚠️ Duplicate Charge Detected (< 48hr window)")
        for dup in anomalies["duplicate_charges"]:
            st.markdown(f"- **Merchant**: {dup['merchant']} | **Amount**: ${dup['amount']:,.2f}\n- {dup['reason']}\n- *Action*: Dispute immediately with card provider.")

    if anomalies["statistical_spikes"]:
        st.warning("### 📈 Statistical Distance Outliers (> 1.75 Standard Deviations)")
        for spike in anomalies["statistical_spikes"]:
            st.markdown(f"- **{spike['merchant']}** (${spike['amount']:,.2f} in {spike['category']}): **{spike['z_score']}σ distance** above normal mean of ${spike['category_mean']:,.2f}.")

    if anomalies["first_time_spikes"]:
        st.info("### 🆕 First-Time Merchant Significant Spend")
        for ft in anomalies["first_time_spikes"]:
            st.markdown(f"- **{ft['merchant']}** (${ft['amount']:,.2f} in {ft['category']}): {ft['reason']}")

# --- TAB 5: Life Value Translator ---
with tab_translator:
    st.subheader("Subscription Opportunity Cost Visualizer ('The Life Value Translator')")
    st.markdown(f"Translating **${opportunity['total_subscription_bleed_monthly']:,.2f}/mo** in creeping recurring expenses into milestone acceleration.")
    st.info(f"Target Milestone: **{opportunity['target_goal']}** (${opportunity['target_remaining']:,.2f} remaining)")

    for t in opportunity["translations"]:
        with st.container(border=True):
            st.markdown(f"### {t['action']}")
            st.markdown(f"**Monthly Saved**: ${t['monthly_saved']:,.2f} | **Annual Liquidity**: ${t['annual_saved']:,.2f}")
            st.success(f"🌱 **Tangible Life Value**: {t['life_value']}")

# --- 1-Click Executive Report Dialog/Expander ---
if st.session_state.get("show_report", False):
    st.divider()
    rep = engine.generate_executive_report()
    st.subheader(f"📋 End-of-Month Executive Report: {rep['executive_verdict']}")
    st.markdown(f"**Net Savings Rate**: {rep['net_savings_rate']} (${rep['net_savings_amount']:,.2f}) • **Buffer Status**: {rep['cushion_buffer_status']}")

    st.markdown("#### Top 3 Financial Leaks")
    for l in rep["top_3_financial_leaks"]:
        st.markdown(f"**{l['rank']}. {l['title']}** (MTD: ${l['leak_amount_mtd']:,.2f}) — {l['impact']}")

    st.markdown("#### 3 High-Impact Corrective Actions")
    for a in rep["corrective_actions"]:
        st.markdown(f"- **{a['action']}** [{a['category']}]: Gain of **{a['expected_gain']}** ({a['execution_effort']})")
    
    if st.button("Close Report"):
        st.session_state.show_report = False
