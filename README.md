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
