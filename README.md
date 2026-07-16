# Customer Care Bot

AI-powered customer care assistant built for FAIC 2026 Hackathon. Resolves customer queries, handles escalations, and retains context across a conversation — built to feel like a competent human support agent, not a static FAQ bot.

## Team

| Role | Name |
|------|------|
| Member | Ayaan |
| Member | Soham |
| Member | Tanay |
| Member | Nishtha |

## Problem

Generic FAQ bots fail on real support load: no memory, no escalation judgment, no ability to actually take action (refund, order status, ticket creation). This bot targets those three gaps.

## Core Features

- **Context-aware conversation** — remembers earlier turns, past tickets/order history within session
- **Sentiment-aware escalation** — detects frustration/urgency, routes to human agent when confidence is low or sentiment is negative
- **Tool-using agent** — can call real backend actions (order lookup, refund initiation, ticket creation) instead of just answering in text
- **Multi-turn resolution** — follows up, asks clarifying questions instead of guessing

## Architecture

```
User (chat widget)
      │
      ▼
Frontend (chat UI)
      │  REST/WebSocket
      ▼
Backend API (orchestrator)
      │
      ├── LLM layer (intent detection, response generation, sentiment scoring)
      │
      ├── Tool-call layer (order lookup, refund API, ticket creation)
      │
      ├── RAG/Knowledge base (product docs, policies, FAQ embeddings)
      │
      └── Escalation logic (confidence/sentiment threshold → human handoff)
      │
      ▼
Database (conversation history, tickets, user/session data)
```

Flow: message in → intent + sentiment classified → if actionable, tool called → response generated (grounded via RAG if knowledge-based) → low confidence or negative sentiment → escalate to human queue.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | _ React + Tailwind
| Backend |  Node+Express
| LLM | _TODO Groq API |
| Vector store / RAG | Pinecone |
| Database |  PostgreSQL |
| Deployment | Render/Vercel |

## Repo Structure

```
/frontend       chat UI
/backend        API, orchestrator, tool handlers
/knowledge_base  docs/FAQ for RAG
/tests          test cases
README.md
```

## Setup

```bash
# clone
git clone <repo-url>
cd customer-care-bot

# backend
cd backend && pip install -r requirements.txt
# add API keys to .env

# frontend
cd ../frontend && npm install
npm run dev
```

## Usage

1. Start backend server
2. Start frontend
3. Open chat widget, start conversation
4. Bot resolves query directly, calls tools when needed, or escalates to human queue when confidence/sentiment threshold triggers

## Roadmap

- [ ] Core chat loop + LLM integration
- [ ] RAG knowledge base ingestion
- [ ] Tool-calling (order lookup, refund, ticket)
- [ ] Sentiment/escalation logic
- [ ] Frontend polish + demo flow
- [ ] Test cases + edge case handling


## How the AI Works

### Agent Loop
Every message goes through a tool-calling loop — the LLM decides whether to answer directly or call a tool (`track_order`, `process_refund`, `escalate_to_human`). Tool results are injected back into LLM context so responses are grounded in real data, not hallucinated.

### Code-Level Refund Gate (Novel)
Refund confirmation is handled in Node.js, not the prompt. When the LLM calls `process_refund`, the orchestrator intercepts it, stores it as `pendingConfirmation`, and asks the user to confirm. Only after a "yes" does it execute. This makes confirmation 100% reliable regardless of LLM behavior.

### Escalation Engine
Three independent rules evaluated after every message:
- **Low sentiment** — score drops below 0.3
- **Loop detected** — same intent repeated 2+ turns with no resolution
- **Explicit request** — user asks for a human

### Sentiment Scoring
Scored 0–1 per message using keyword weights, caps lock ratio, and exclamation count. Passed into the system prompt so the LLM adapts its tone in real time. Falls below 0.3 → escalation triggers automatically.

## How to Test (For Judges)

We built several advanced edge cases to prove our bot isn't just a basic wrapper. Try these exact prompts in the Chat UI to test our logic:

### 1. The Refund Confirmation Gate
When you ask for a refund, the bot cannot blindly process it. It intercepts the tool call and asks for confirmation first.
- **Type:** `I want a refund for order 1042`
- **Expected:** The bot asks you to confirm the $45.99 refund for your Medium Blue Jacket.
- **Type:** `yes please`
- **Expected:** The refund successfully executes.

### 2. Proactive Context Tracking
The bot knows your state before you even type an order ID.
- **Type:** `Where is my order?`
- **Expected:** The bot automatically infers your order ID from the mock database context and gives you the tracking info without asking you for the ID.

### 3. The Anti-Loop Escalation Engine
If the bot gets stuck or you keep asking the same thing, it auto-escalates.
- **Type:** `i need help`
- **Expected:** Bot asks what you need help with.
- **Type:** `i need help`
- **Expected:** Bot asks again.
- **Type:** `i need help`
- **Expected:** The Orchestrator detects `unresolvedAttempts >= 2` and instantly escalates you to a human agent.

### 4. Sentiment-Triggered Escalation
The bot reads the sentiment of every message in real-time.
- **Type:** `this is terrible and i hate this useless service`
- **Expected:** The sentiment score drops below 0.3 and instantly triggers a human handoff.