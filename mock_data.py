"""
mock_data.py - Fail-Safe Reference Dataset for FinPilot (August 2026 Timeframe)
AI Agent Hackathon 2026 - Deterministic Personal Finance Support Agent
"""

from datetime import datetime
from typing import List, Dict, Any

# Target Context: Current Date is August 19, 2026.
CURRENT_DATE_STR = "2026-08-19"
CURRENT_DATE = datetime.strptime(CURRENT_DATE_STR, "%Y-%m-%d")

# User Financial Baseline Profile
USER_PROFILE = {
    "user_id": "usr_hackathon_2026",
    "name": "Alex Mercer",
    "currency": "USD",
    "monthly_salary": 6500.00,
    "pay_frequency": "bi-weekly",
    "pay_days": ["2026-08-01", "2026-08-15"],
    "next_paycheck_date": "2026-09-01",
    "current_liquid_balance": 3450.00,
    "safety_buffer_minimum": 1000.00,
    "goals": [
        {
            "id": "goal_emergency",
            "name": "Emergency Cushion Buffer",
            "target_amount": 1000.00,
            "current_amount": 1000.00,
            "horizon": "Immediate",
            "status": "Achieved"
        },
        {
            "id": "goal_laptop",
            "name": "M4 Max Engineering Workstation",
            "target_amount": 2800.00,
            "current_amount": 1450.00,
            "target_date": "2026-11-30",
            "horizon": "Medium-Term",
            "status": "In Progress"
        },
        {
            "id": "goal_travel",
            "name": "Japan Autumn Expedition",
            "target_amount": 3500.00,
            "current_amount": 1200.00,
            "target_date": "2026-10-15",
            "horizon": "Milestone",
            "status": "In Progress"
        },
        {
            "id": "goal_debt",
            "name": "Credit Card Zero-Balance Paydown",
            "target_amount": 1800.00,
            "current_amount": 1200.00,
            "target_date": "2026-09-30",
            "horizon": "Short-Term",
            "status": "In Progress"
        }
    ],
    "category_budgets": {
        "Housing/Rent": 1800.00,
        "Utilities": 350.00,
        "Groceries": 550.00,
        "Dining Out": 400.00,
        "Transportation": 250.00,
        "Shopping": 350.00,
        "Tech/Cloud": 150.00,
        "Healthcare": 200.00,
        "Discretionary": 250.00
    }
}

# Transaction Records for August 2026 (MTD up to Aug 19, 2026 + prior month data for inflation tracking)
# Amounts: Positive for Inflows (Credits), Negative for Outflows (Debits)
RAW_TRANSACTIONS: List[Dict[str, Any]] = [
    # Inflows (Salary)
    {"id": "tx_001", "date": "2026-08-01", "merchant": "TechCorp Payroll", "category": "Income", "amount": 3250.00, "type": "credit", "payment_mode": "Direct Deposit", "notes": "Bi-weekly salary"},
    {"id": "tx_002", "date": "2026-08-15", "merchant": "TechCorp Payroll", "category": "Income", "amount": 3250.00, "type": "credit", "payment_mode": "Direct Deposit", "notes": "Bi-weekly salary"},

    # Housing & Fixed Bills
    {"id": "tx_003", "date": "2026-08-01", "merchant": "Beacon Hill Apartments", "category": "Housing/Rent", "amount": -1800.00, "type": "debit", "payment_mode": "ACH", "notes": "Monthly Rent"},
    {"id": "tx_004", "date": "2026-08-03", "merchant": "Metro Power & Light", "category": "Utilities", "amount": -145.20, "type": "debit", "payment_mode": "AutoPay", "notes": "Electric Utility"},
    {"id": "tx_005", "date": "2026-08-05", "merchant": "City Municipal Water", "category": "Utilities", "amount": -68.50, "type": "debit", "payment_mode": "AutoPay", "notes": "Water & Sewage"},
    {"id": "tx_006", "date": "2026-08-07", "merchant": "Gigabit Fiber Net", "category": "Utilities", "amount": -85.00, "type": "debit", "payment_mode": "Credit Card", "notes": "Home Internet"},

    # Recurring Subscriptions with Silent Inflation MoM
    # Netflix: June $15.99 -> July $17.99 -> August $22.99 (+27.8% price creep!)
    {"id": "tx_007", "date": "2026-08-08", "merchant": "Netflix Premium", "category": "Discretionary", "amount": -22.99, "type": "debit", "payment_mode": "Credit Card", "notes": "Streaming Subscription"},
    # AWS Cloud: June $42.00 -> July $51.00 -> August $68.50 (Silent usage/pricing inflation!)
    {"id": "tx_008", "date": "2026-08-09", "merchant": "AWS Cloud Services", "category": "Tech/Cloud", "amount": -68.50, "type": "debit", "payment_mode": "Credit Card", "notes": "Cloud infrastructure"},
    # Spotify: $14.99/mo
    {"id": "tx_009", "date": "2026-08-11", "merchant": "Spotify Family", "category": "Discretionary", "amount": -16.99, "type": "debit", "payment_mode": "Credit Card", "notes": "Music streaming"},
    # Fitness / Gym: $75.00/mo
    {"id": "tx_010", "date": "2026-08-02", "merchant": "IronPeak Fitness", "category": "Healthcare", "amount": -75.00, "type": "debit", "payment_mode": "AutoPay", "notes": "Monthly gym membership"},
    # AI Assistant Tooling (OpenAI/Claude): $20.00/mo
    {"id": "tx_011", "date": "2026-08-12", "merchant": "AI Tools Pro", "category": "Tech/Cloud", "amount": -20.00, "type": "debit", "payment_mode": "Credit Card", "notes": "AI Subscription"},
    # NYTimes News: $12.00 in June -> $17.00 in August
    {"id": "tx_012", "date": "2026-08-14", "merchant": "NYTimes Digital", "category": "Discretionary", "amount": -17.00, "type": "debit", "payment_mode": "Credit Card", "notes": "News publication"},

    # Groceries (Steady cadences)
    {"id": "tx_013", "date": "2026-08-02", "merchant": "Trader Joe's", "category": "Groceries", "amount": -94.20, "type": "debit", "payment_mode": "Debit Card", "notes": "Weekly grocery run"},
    {"id": "tx_014", "date": "2026-08-08", "merchant": "Whole Foods Market", "category": "Groceries", "amount": -118.45, "type": "debit", "payment_mode": "Credit Card", "notes": "Organic produce"},
    
    # INTENTIONAL ANOMALY: DUPLICATE CHARGE within 48 hours!
    # Charged $74.50 at Whole Foods on Aug 14 at 10:15 AM and again Aug 15 at 09:30 AM
    {"id": "tx_015", "date": "2026-08-14", "merchant": "Whole Foods Market", "category": "Groceries", "amount": -74.50, "type": "debit", "payment_mode": "Credit Card", "notes": "Pantry restock"},
    {"id": "tx_016", "date": "2026-08-15", "merchant": "Whole Foods Market", "category": "Groceries", "amount": -74.50, "type": "debit", "payment_mode": "Credit Card", "notes": "Duplicate billing error"},

    # Dining Out (Velocity burn issue: High frequency)
    {"id": "tx_017", "date": "2026-08-03", "merchant": "Chipotle Mexican Grill", "category": "Dining Out", "amount": -22.50, "type": "debit", "payment_mode": "Apple Pay", "notes": "Lunch"},
    {"id": "tx_018", "date": "2026-08-04", "merchant": "Blue Bottle Coffee", "category": "Dining Out", "amount": -14.80, "type": "debit", "payment_mode": "Apple Pay", "notes": "Morning coffee"},
    {"id": "tx_019", "date": "2026-08-06", "merchant": "Osteria Bella Bistro", "category": "Dining Out", "amount": -135.00, "type": "debit", "payment_mode": "Credit Card", "notes": "Dinner with colleagues"},
    {"id": "tx_020", "date": "2026-08-10", "merchant": "Sweetgreen", "category": "Dining Out", "amount": -19.75, "type": "debit", "payment_mode": "Apple Pay", "notes": "Lunch salad"},
    {"id": "tx_021", "date": "2026-08-13", "merchant": "Blue Bottle Coffee", "category": "Dining Out", "amount": -15.40, "type": "debit", "payment_mode": "Apple Pay", "notes": "Coffee & pastry"},
    {"id": "tx_022", "date": "2026-08-16", "merchant": "Izakaya Sakura", "category": "Dining Out", "amount": -142.00, "type": "debit", "payment_mode": "Credit Card", "notes": "Weekend social dinner"},
    {"id": "tx_023", "date": "2026-08-18", "merchant": "Blue Bottle Coffee", "category": "Dining Out", "amount": -16.20, "type": "debit", "payment_mode": "Apple Pay", "notes": "Coffee meeting"},

    # Transportation
    {"id": "tx_024", "date": "2026-08-04", "merchant": "Uber Transit", "category": "Transportation", "amount": -34.50, "type": "debit", "payment_mode": "Credit Card", "notes": "Airport ride"},
    {"id": "tx_025", "date": "2026-08-09", "merchant": "Chevron Gas Station", "category": "Transportation", "amount": -58.20, "type": "debit", "payment_mode": "Debit Card", "notes": "Fuel fill-up"},
    {"id": "tx_026", "date": "2026-08-17", "merchant": "Metro Transit Pass", "category": "Transportation", "amount": -45.00, "type": "debit", "payment_mode": "Apple Pay", "notes": "Subway transit pass"},

    # Shopping & Tech
    {"id": "tx_027", "date": "2026-08-05", "merchant": "Amazon.com", "category": "Shopping", "amount": -48.90, "type": "debit", "payment_mode": "Credit Card", "notes": "Desk cables & organizers"},
    {"id": "tx_028", "date": "2026-08-11", "merchant": "Uniqlo Apparel", "category": "Shopping", "amount": -89.50, "type": "debit", "payment_mode": "Credit Card", "notes": "Summer basics"},

    # INTENTIONAL ANOMALY: FIRST-TIME MERCHANT UNUSUAL SPEND
    # User has never shopped at "NordicTech Audio" before, and spends $389.00
    {"id": "tx_029", "date": "2026-08-12", "merchant": "NordicTech Audio", "category": "Shopping", "amount": -389.00, "type": "debit", "payment_mode": "Credit Card", "notes": "Noise-cancelling headphones"},

    # INTENTIONAL ANOMALY: STATISTICAL SPIKE (> 1.75 SD from Category Mean)
    # Healthcare mean is ~$45; Sudden $480.00 dental/clinic charge
    {"id": "tx_030", "date": "2026-08-17", "merchant": "Apex Specialty Dental", "category": "Healthcare", "amount": -480.00, "type": "debit", "payment_mode": "Credit Card", "notes": "Unplanned crown replacement"}
]

# Historical Subscription Baseline for Inflation Comparison (June, July, August 2026)
SUBSCRIPTION_HISTORY = [
    {
        "merchant": "Netflix Premium",
        "category": "Discretionary",
        "cadence": "Monthly",
        "history": [
            {"month": "2026-06", "amount": 15.99},
            {"month": "2026-07", "amount": 17.99},
            {"month": "2026-08", "amount": 22.99}
        ],
        "status": "Active",
        "inflation_flag": True,
        "inflation_pct_mom": 27.79,
        "next_due_date": "2026-09-08"
    },
    {
        "merchant": "AWS Cloud Services",
        "category": "Tech/Cloud",
        "cadence": "Monthly",
        "history": [
            {"month": "2026-06", "amount": 42.00},
            {"month": "2026-07", "amount": 51.00},
            {"month": "2026-08", "amount": 68.50}
        ],
        "status": "Active",
        "inflation_flag": True,
        "inflation_pct_mom": 34.31,
        "next_due_date": "2026-09-09"
    },
    {
        "merchant": "NYTimes Digital",
        "category": "Discretionary",
        "cadence": "Monthly",
        "history": [
            {"month": "2026-06", "amount": 12.00},
            {"month": "2026-07", "amount": 12.00},
            {"month": "2026-08", "amount": 17.00}
        ],
        "status": "Active",
        "inflation_flag": True,
        "inflation_pct_mom": 41.67,
        "next_due_date": "2026-09-14"
    },
    {
        "merchant": "Spotify Family",
        "category": "Discretionary",
        "cadence": "Monthly",
        "history": [
            {"month": "2026-06", "amount": 16.99},
            {"month": "2026-07", "amount": 16.99},
            {"month": "2026-08", "amount": 16.99}
        ],
        "status": "Active",
        "inflation_flag": False,
        "inflation_pct_mom": 0.0,
        "next_due_date": "2026-09-11"
    },
    {
        "merchant": "IronPeak Fitness",
        "category": "Healthcare",
        "cadence": "Monthly",
        "history": [
            {"month": "2026-06", "amount": 75.00},
            {"month": "2026-07", "amount": 75.00},
            {"month": "2026-08", "amount": 75.00}
        ],
        "status": "Active",
        "inflation_flag": False,
        "inflation_pct_mom": 0.0,
        "next_due_date": "2026-09-02"
    },
    {
        "merchant": "AI Tools Pro",
        "category": "Tech/Cloud",
        "cadence": "Monthly",
        "history": [
            {"month": "2026-06", "amount": 20.00},
            {"month": "2026-07", "amount": 20.00},
            {"month": "2026-08", "amount": 20.00}
        ],
        "status": "Active",
        "inflation_flag": False,
        "inflation_pct_mom": 0.0,
        "next_due_date": "2026-09-12"
    }
]

# Raw Arbitrary Header CSV sample for ingestion verification
SAMPLE_ARBITRARY_CSV = """Txn_Timestamp,Vendor_Description,Category_Assigned,Debited_USD,Credited_USD,Channel
2026-08-01,TechCorp Payroll,Direct Pay,,3250.00,ACH_CREDIT
2026-08-01,Beacon Hill Apartments,Housing Expense,1800.00,,ACH_DEBIT
2026-08-03,Metro Power & Light,Bills & Power,145.20,,ONLINE_BILL
2026-08-08,Netflix Premium,Streaming & Media,22.99,,VISA_9421
2026-08-14,Whole Foods Market,Groceries & Food,74.50,,AMEX_3012
2026-08-15,Whole Foods Market,Groceries & Food,74.50,,AMEX_3012
2026-08-17,Apex Specialty Dental,Medical & Dental,480.00,,MASTERCARD_1190
"""
