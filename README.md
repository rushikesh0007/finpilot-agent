# FinPilot: Autonomous Financial Decision-Support Agent

FinPilot is a personal finance decision-support agent designed to bridge the gap between deterministic mathematical calculation and natural language advisory. Rather than relying on approximate generative arithmetic, FinPilot executes all calculations, statistical outlier audits, and liquidity checks through a rigid computation engine, then synthesizes recommendations into clear, consumer-friendly guidance.

---

## Key Features

### 1. Real-Time Financial Metric Cards
- **Total Income**: Aggregates all verified inflows and credits with deposit timestamps.
- **Total Expenses**: Tracks debits and calculates dynamic daily burn rates based on statement elapsed days.
- **Net Savings Rate**: Evaluates monthly cash flow surplus or deficit relative to total earned income.
- **Buffer Headroom**: Measures liquid cash reserves above the user's non-negotiable safety floor ($1,000 baseline).

### 2. Intelligent Statement Ingestion & Normalization
- Supports CSV and TSV bank and credit card statement uploads.
- Auto-detects and normalizes arbitrary column formats (e.g., `Debit/Credit`, `Amount`, `Transaction Date`, `Description`, `Merchant`, `Category`).
- Ingested files dynamically update active statement periods, month badges, and all downstream metrics in real time.

### 3. FinPilot Decision Assistant
- Natural language chat assistant powered by Gemini 2.5 Flash (`@google/genai`).
- Answers complex discretionary spending questions (e.g., *"Can I buy a $750 laptop?"*, *"Audit my recurring subscriptions"*).
- Delivers clean, consumer-oriented markdown responses with bold metrics and actionable advice—completely free of internal debug logs or raw data dumps.

### 4. Dynamic Budgets & Spending Velocity
- Monitors spending pace across standard household categories (Groceries, Dining Out, Utilities, Shopping, Tech, etc.).
- Computes daily burn rates and projects month-end totals against fixed allocations.
- Flags early warning indicators when velocity exceeds calendar day progression.

### 5. Anomaly & Duplicate Detection
- **Duplicate Detection**: Flags identical debit amounts at the same merchant within a 48-hour timestamp window.
- **Statistical Outliers**: Detects transactions exceeding category averages by >1.75 standard deviations (Z-score).
- **First-Time Store Spikes**: Highlights unfamiliar vendors with debit sizes significantly above typical discretionary transactions.

### 6. Subscription Creep & Committed Bills
- Tracks recurring monthly services and detects stealth price hikes (e.g., streaming and cloud service increases).
- Calculates committed obligations across the next 15-day and 30-day horizons so users never overdraft before payday.

### 7. Life-Value & Goal Trade-Off Translator
- Converts recurring subscription bleed into tangible life milestones (e.g., *"Trimming $84/mo in unused streaming services funds a new workstation 5.2 weeks faster"*).

### 8. Affordability & Stress-Test Simulator
- Simulates counterfactual one-time purchases and recurring EMI commitments.
- Evaluates immediate balance impact, upcoming bill obligations before next paycheck, and projected cushion headroom.

### 9. 1-Click Executive Financial Health Report
- Generates an instant summary modal outlining total net savings, burn rates, categorized leaks, and prioritized next steps.

---

## System Architecture

```
finpilot/
├── src/                         # React 19 Frontend
│   ├── components/              # Modular UI Components
│   │   ├── MetricCards.tsx      # Top 4 Reactive Summary Cards
│   │   ├── DecisionCockpit.tsx  # Natural Language Decision Assistant
│   │   ├── DynamicBudgetsView.tsx # Velocity & Budget Utilization
│   │   ├── AnomaliesView.tsx    # Outlier & Duplicate Transaction Alerts
│   │   ├── SubscriptionBleedView.tsx # Recurring Leakage & Bill Obligations
│   │   ├── LifeValueTranslatorView.tsx # Opportunity Cost & Milestone Impact
│   │   ├── AffordabilitySimulator.tsx # Purchase Stress-Testing Engine
│   │   ├── TransactionsView.tsx # Filterable Statement Ledger
│   │   └── ExecutiveReportModal.tsx # 1-Click Health Summary Modal
│   ├── App.tsx                  # Root View Controller & State Management
│   ├── types.ts                 # TypeScript Schema & Interface Definitions
│   └── main.tsx                 # React Application Entry Point
├── server.ts                    # Full-Stack Express API Server & Gemini Proxy
├── tools.py                     # Deterministic Python Mathematical Engine
├── agent.py                     # Python Agent Reasoning Loop & Tool Orchestration
├── app.py                       # Streamlit Interface
├── mock_data.py                 # Baseline Financial Dataset & Transaction Records
├── metadata.json                # AI Studio Application Configuration
├── package.json                 # Node Dependencies & Build Scripts
└── tsconfig.json                # TypeScript Compiler Settings
```

---

## Getting Started

**Live Application:** https://finpilot-agent.streamlit.app/

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**
- *(Optional)* **Python**: 3.10+ (if running the alternate Streamlit interface)

### Environment Setup
Create a `.env` file in the root directory (or configure via AI Studio Secrets):

```env
# Google Gemini API key for natural language recommendations
GEMINI_API_KEY=your_gemini_api_key_here
```

### Installation

Install Node dependencies:
```bash
npm install
```

### Running the Full-Stack Application (React + Express)

Start the integrated development server on port 3000:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

Compile static assets and bundle the server:
```bash
npm run build
npm start
```

### Alternate Streamlit Interface

To run the standalone Python Streamlit dashboard:
```bash
pip install streamlit
streamlit run app.py
```

---

## Design Philosophy

- **Mathematical Determinism**: Financial decisions, burn rates, and buffer calculations are executed strictly by deterministic functions, never by generative approximation.
- **Consumer-First UX**: All technical debug traces, JSON view blocks, and raw execution logs are suppressed in the frontend, providing a clean, accessible financial companion.
- **Zero Latent Overdrafts**: Forward-looking obligations and upcoming bills are prioritized over static account balance figures.
