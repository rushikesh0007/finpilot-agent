"""
app.py - Reactive Streamlit Dashboard for FinPilot
AI Agent Hackathon 2026 - Autonomous Personal Finance Decision-Support Agent
"""

import streamlit as st
import json
from tools import FinanceEngine
from agent import FinPilotAgent

# Configure Page
st.set_page_config(
    page_title="FinPilot | Autonomous Personal Finance Agent",
    page_icon="🧭",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize Session State
if "engine" not in st.session_state:
    st.session_state.engine = FinanceEngine()
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

engine = st.session_state.engine
agent = st.session_state.agent

# --- Sidebar: Ingestion & Controls ---
with st.sidebar:
    st.title("🧭 FinPilot Controls")
    st.caption("AI Agent Hackathon 2026 • Autonomous Decision Support")
    
    st.subheader("Data Normalization & Ingestion")
    uploaded_file = st.file_uploader("Upload Bank/Card Export (CSV/TSV)", type=["csv", "tsv"])
    if uploaded_file is not None:
        raw_text = uploaded_file.getvalue().decode("utf-8")
        ext = "tsv" if uploaded_file.name.endswith(".tsv") else "csv"
        res = engine.normalize_and_ingest(raw_text, file_type=ext)
        if res["status"] == "success":
            st.success(f"Ingested {res['ingested_count']} transactions with dynamic column normalization!")
        else:
            st.error(res["message"])

    st.divider()
    st.subheader("Safety Cushion & Targets")
    st.metric("Liquid Reserves", f"${engine.profile['current_liquid_balance']:,.2f}")
    st.metric("Safety Buffer Minimum", f"${engine.profile['safety_buffer_minimum']:,.2f}")
    st.metric("Next Paycheck", engine.profile["next_paycheck_date"])

    st.divider()
    if st.button("Generate 1-Click Executive Report", use_container_width=True):
        st.session_state.show_report = True

# --- Main Dashboard Header ---
st.title("FinPilot: Autonomous Financial Decision-Support Agent")
st.markdown("*Mathematical determinism in the tools • Autonomous cognitive reasoning in the orchestrator*")

# Fetch Real-time Engine Metrics
summary = engine.get_monthly_summary(month=8, year=2026)
budgets = engine.compare_budgets()
anomalies = engine.detect_anomalies()
recurring = engine.detect_recurring_and_subscriptions()
opportunity = engine.calculate_opportunity_cost()

# Top Metric Cards
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric("Total Income (MTD)", f"${summary['total_income']:,.2f}", "+$3,250 on Aug 15")
with col2:
    st.metric("Total Expenses (MTD)", f"${summary['total_expenses']:,.2f}", f"{summary['days_elapsed']} of {summary['days_in_month']} days")
with col3:
    st.metric("Net Savings Rate", f"{summary['savings_rate_pct']}%", f"${summary['net_savings']:,.2f} surplus")
with col4:
    headroom = summary['buffer_headroom']
    st.metric("Buffer Headroom", f"${headroom:,.2f}", "Above $1,000 Safety Floor", delta_color="normal")

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
            if msg.get("trace"):
                t = msg["trace"]
                with st.expander("🔍 Agent Transparency & Internal Audit Trace", expanded=False):
                    st.markdown(f"**Thought Process**:\n`{t['thought_process']}`")
                    st.markdown(f"**Tool Invoked**: `{t['tool_invocation']['tool']}`")
                    st.json(t["tool_invocation"]["parameters"])
                    st.markdown("**Deterministic Mathematical Observation**:")
                    st.json(t["mathematical_observation"])

    # Chat Input
    user_prompt = st.chat_input("Ask FinPilot a decision question...")
    if "prompt_input" in st.session_state:
        user_prompt = st.session_state.pop("prompt_input")

    if user_prompt:
        st.session_state.messages.append({"role": "user", "content": user_prompt, "trace": None})
        with st.chat_message("user"):
            st.markdown(user_prompt)

        with st.chat_message("assistant"):
            with st.status("Executing Deterministic Internal Audit Loop...", expanded=True) as status:
                st.write("🧠 Formulating hypothesis and identifying tool requirements...")
                result = agent.process_query(user_prompt)
                st.write(f"⚡ Dispatched tool: `{result['tool_invocation']['tool']}`")
                st.write("📊 Rigid mathematical observation retrieved without latent arithmetic.")
                status.update(label="Audit Complete • Recommendation Synthesized", state="complete", expanded=False)

            st.markdown(result["synthesized_recommendation"])
            with st.expander("🔍 Agent Transparency & Internal Audit Trace", expanded=True):
                st.markdown(f"**Thought Process**:\n`{result['thought_process']}`")
                st.markdown(f"**Tool Invoked**: `{result['tool_invocation']['tool']}`")
                st.json(result["tool_invocation"]["parameters"])
                st.markdown("**Deterministic Mathematical Observation**:")
                st.json(result["mathematical_observation"])

        st.session_state.messages.append({
            "role": "assistant",
            "content": result["synthesized_recommendation"],
            "trace": result
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
