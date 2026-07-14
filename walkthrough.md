# Walkthrough: AI Customer Care Assistant Prototype

We have successfully scaffolded and verified the first prototype of the AI-powered Customer Care Assistant (Flowzint). Both the frontend and backend are initialized, connected, and running locally.

---

## 1. Accomplishments

### Backend Services (Express API Orchestrator)
- **Entry Point Server ([index.js](file:///c:/Users/LENOVO/Desktop/Flowzint/backend/src/index.js)):** Setup on port `5000` with CORS support, JSON processing, `/api/health` checking, `/api/orders` database serving, and `/api/chat` orchestration.
- **Orchestration Engine ([orchestrator.js](file:///c:/Users/LENOVO/Desktop/Flowzint/backend/src/orchestrator.js)):** Configured dual execution modes:
  1. *Real LLM Mode:* Uses the official Groq SDK (requires `GROQ_API_KEY` in `.env`) with tool declarations for function calling.
  2. *Simulated Agent Mode:* Out-of-the-box local heuristic reasoning that parses inputs (e.g., matching keywords, tracking requests, refund requests, and user sentiments) to simulate the precise response and tool outputs of the LLM.
- **Mock Actions & Database ([mockTools.js](file:///c:/Users/LENOVO/Desktop/Flowzint/backend/src/tools/mockTools.js)):** Created state management for order structures and structured tool executions:
  - `track_order`: Lookup order delivery statuses, carrier details, and ETA.
  - `process_refund`: Transition refund fields to `YES` upon user requests.
  - `escalate_to_human`: Handle fallback workflows when confidence drops or negative sentiment is flagged.

### Frontend Dashboard (React + Tailwind CSS)
- **Configuration & Integration:** Bootstrapped React/Vite in the `/frontend` directory and configured it with **Tailwind CSS v4** utilizing `@tailwindcss/postcss` for seamless CSS compilation.
- **App Layout ([App.jsx](file:///c:/Users/LENOVO/Desktop/Flowzint/frontend/src/App.jsx)):** Created a premium dark-themed customer care interface split into three columns:
  1. *Diagnostics & Metrics Pane (Left):* Renders the active `Session ID`, a real-time color-coded **Sentiment Score Gauge** (Angry, Neutral, Happy), a **Human Escalation Status Indicator** (red alert card if triggered), and a chronological **Tool Execution Log** (e.g., `track_order() - Success`).
  2. *Interactive Chat Widget (Center):* Displays streaming message blocks with styled bubbles, loader animations, and suggested test prompt pills (hello, tracking, refunding, human connection).
  3. *Live Database Explorer (Right):* Renders a real-time visual representation of the active mock order database. Whenever the bot triggers the refund API, Order #1042's status shifts dynamically to `Refunded: YES` in green.

---

## 2. Running Services Locally

Both components are running inside background tasks. If you need to restart them, use the following terminal actions:

### Start Backend Orchestrator
```bash
cd backend
npm start
```
*Port:* `http://localhost:5000`

### Start Frontend Client
```bash
cd frontend
npm run dev
```
*Port:* `http://localhost:5173`

---

## 3. Manual Verification & Demo Flow

You can open **[http://localhost:5173/](http://localhost:5173/)** in your browser to play with the prototype. Here is the recommended verification script:

1. **Informational & Tool Call (Tracking):**
   - Click on the suggestion pill: `"Track Order #54321"` (or type *"where is my package 54321"*).
   - *Verification:* The assistant will trigger the `track_order` tool. You will see a `⚡ Executed: track_order` label under the bubble, a log entry added in the left panel, and a structured response about the package's transit status.
2. **Transactional & State-Modifying Tool Call (Refunds):**
   - Note that Order #1042 in the right *Live Database Explorer* shows `Refunded: NO` (red dot).
   - Click on the suggestion pill: `"Refund Order #1042"` (or type *"I need a refund for my jacket order 1042"*).
   - *Verification:* The assistant triggers the `process_refund` tool. The left log will record `process_refund() - Success`. The assistant will confirm the refund, and the *Live Database Explorer* on the right will dynamically update to show `Refunded: YES` (green dot).
3. **Sentiment & Confidence-Based Escalation:**
   - Click `"Speak to human"` (or type *"terrible service, give me a human agent"*).
   - *Verification:* The assistant detects frustration and human escalation intent. It triggers `escalate_to_human`, transitions the left indicator to `⚠️ ESCALATED TO LIVE QUEUE` (red card), disables the chat inputs to represent active human session transfer, and outputs a handoff response.
