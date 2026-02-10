# AI Advisor Feature

The AI Advisor module provides personalized financial insights using Google's Gemini models.

## Workflow
1. **Data Aggregation:** The backend fetches all active records for the current group:
    - Monthly Incomes
    - Pending and Paid Bills
    - Recent Variable Expenses (Random Expenses)
    - Active Investments
2. **Prompt Engineering:** A structured prompt is created, feeding this raw data to the model and requesting a JSON response with specific keys (`diagnostico`, `estrategia`, etc.).
3. **Model:** Uses `gemini-flash-latest` for low latency and high cost-efficiency.
4. **Caching (Redis):**
    - A MD5 hash of the financial data summary is generated.
    - If the same data hash is requested again, the system returns the cached advice from Redis.
    - Cache TTL is set to 24 hours.

## Output
The frontend renders the JSON response into a dashboard displaying:
- **Diagnosis:** A health check of finances.
- **Action Plan:** Concrete steps to improve.
- **Investment Tips:** Suggestions based on surplus.