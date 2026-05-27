import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from google import genai
from google.genai import types

app = FastAPI(title="Wallet AI Insights Core")

# Enable secure cross-origin requests from both local machine and live GitHub website
origins = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "https://reychanningtatum.github.io"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the next-generation Google GenAI client profile
# Get your free key at: https://aistudio.google.com/
# It will automatically check for the GEMINI_API_KEY environment variable.
client = genai.Client()

class ExpenseItem(BaseModel):
    id: Any
    name: str
    amount: float
    time: str

class DayData(BaseModel):
    dateKey: str
    dayOfMonth: int
    budget: float
    totalSpent: float
    balance: float
    carryOver: float
    cutoffAssignment: Any
    isNoExpenseMarked: bool

class AnalysisPayload(BaseModel):
    salaryCycle: str
    rolloverMode: str
    totalBudgetAmount: float
    calendarDays: List[DayData]
    expenseDatabase: Dict[str, List[ExpenseItem]]

@app.post("/api/insights")
async def generate_financial_insights(payload: AnalysisPayload):
    try:
        # 1. Compile structured overview parameters to optimize context length
        total_spent = sum(d.totalSpent for d in payload.calendarDays)
        total_budget = sum(d.budget for d in payload.calendarDays)
        overspent_days = sum(1 for d in payload.calendarDays if d.totalSpent > d.budget)
        no_spend_days = sum(1 for d in payload.calendarDays if d.totalSpent == 0 and not d.isNoExpenseMarked)
        lockout_days = sum(1 for d in payload.calendarDays if d.isNoExpenseMarked)
        
        # 2. Extract full raw ledger items across dates for deep pattern mapping
        flat_history = []
        for date_key, expenses in payload.expenseDatabase.items():
            for exp in expenses:
                flat_history.append(f"- [{date_key}] {exp.name}: ₱{exp.amount}")
        history_block = "\n".join(flat_history) if flat_history else "No recorded transactions."

        # 3. Construct an advanced behavioral prompt
        prompt = f"""
        You are an elite, mathematical financial analyst and survival budgeting AI for a calendar tracking application.
        Analyze the following user data framework and return 4 targeted, actionable insights.

        METRIC PARAMS:
        - Salary Configuration Mode: {payload.salaryCycle}
        - Rollover Optimization Mode: {payload.rolloverMode}
        - Base Matrix Budget Allocation: ₱{payload.totalBudgetAmount}
        - Aggregated Operational Spending: ₱{total_spent}
        - Total Compiled Cycle Target Budget: ₱{total_budget}
        - Overspent Calendar Nodes: {overspent_days} days
        - Natural Zero Spend Targets: {no_spend_days} days
        - Explicitly Audited Lockout Nodes (Ø Spend): {lockout_days} days

        RAW TRANSACTION HISTORY LEDGER LOG:
        {history_block}

        CRITICAL OUTPUT INSTRUCTIONS:
        - Return exactly a JSON object containing a key named "insights" which maps to an array of exactly 4 strings.
        - Do not include markdown wraps like ```json in your response. Return pure structural text.
        - Every insight line must look professional, highly contextualized to their exact spending items, and offer predictive advice.
        - Address cutoff transitions or rollover velocity parameters directly based on data patterns.
        - Inject relevant emojis at the start of each line matching the tone (e.g., ⚠️, 📈, 🛍️, 🏆, 💡).
        """

        # 4. Request clean schema validation from Gemini 2.5 Flash Free Tier
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "insights": types.Schema(
                            type=types.Type.ARRAY,
                            items=types.Schema(type=types.Type.STRING)
                        )
                    },
                    required=["insights"]
                ),
                temperature=0.2
            )
        )
        
        # Return structured text string response directly back to the front-end fetch receiver
        return response.text

    except Exception as e:
        print(f"Exception triggered inside Python AI Engine: {str(e)}")
        return '{"insights": ["❌ The Python AI instance encountered an evaluation interruption.", "💡 Check that your server environment has a valid GEMINI_API_KEY variable set.", "🔄 Ensure the local uvicorn development proxy port is listening properly.", "📈 System data streams are still running stable on your frontend layer."]}'

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)