import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './components/ChatMessage';
import ConfirmationCard from './components/ConfirmationCard';
import LoadingIndicator from './components/LoadingIndicator';
import SentimentGauge from './components/SentimentGauge';
import AgentDashboard from './components/AgentDashboard';
import ToolLog from './components/ToolLog';
import DatabaseExplorer from './components/DatabaseExplorer';

const API_BASE = 'http://localhost:5000/api';

/** Determine a context-specific loading message based on the user's text. */
function detectLoadingPhase(text) {
  const lower = text.toLowerCase();
  if (lower.includes('refund') || lower.includes('return') || lower.includes('money back'))
    return '💳 Processing refund request...';
  if (lower.includes('track') || lower.includes('where') || lower.includes('status'))
    return '🔍 Searching order records...';
  if (lower.includes('human') || lower.includes('agent') || lower.includes('manager') || lower.includes('person'))
    return '🤝 Connecting to support specialist...';
  return '💬 Thinking...';
}

export default function App() {
  // ── State ──────────────────────────────────────────────
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substr(2, 9));
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hello! I'm your Flowzint AI assistant. I can help you track orders, process refunds, or connect you with a specialist. How can I help?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('💬 Thinking...');
  const [sentiment, setSentiment] = useState(0.5);
  const [sentimentHistory, setSentimentHistory] = useState([0.5]);
  const [escalated, setEscalated] = useState(false);
  const [toolLogs, setToolLogs] = useState([]);
  const [orders, setOrders] = useState({});
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [showAgentDashboard, setShowAgentDashboard] = useState(false);

  const messagesEndRef = useRef(null);

  // ── Effects ────────────────────────────────────────────
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, pendingConfirmation]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      if (res.ok) setOrders(await res.json());
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ── API Call (no user-message handling) ─────────────────
  const callAPI = async (text) => {
    setLoadingPhase(detectLoadingPhase(text));
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      });

      if (!res.ok) throw new Error('Network response error');
      const data = await res.json();

      // Record tool execution in sidebar log
      if (data.toolExecuted) {
        setToolLogs(prev => [
          {
            tool: data.toolExecuted,
            status: data.toolStatus,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          },
          ...prev,
        ]);
        fetchOrders();
      }

      setSentiment(data.sentiment);
      setSentimentHistory(prev => [...prev, data.sentiment]);

      if (data.escalated) {
        setEscalated(true);
        setShowAgentDashboard(true);
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tool: data.toolExecuted,
          toolStatus: data.toolStatus,
          toolData: data.toolData,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I encountered an error connecting to the server. Please ensure the backend is running on port 5000.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── User-Facing Send Handler ───────────────────────────
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;
    if (!textToSend) setInputText('');

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);

    // Two-phase refund gate: intercept refund requests that mention a known order
    const lower = text.toLowerCase();
    if (lower.includes('refund') && !pendingConfirmation) {
      const orderMatch = text.match(/\b(\d{4,5})\b/);
      if (orderMatch && orders[orderMatch[1]] && !orders[orderMatch[1]].refunded) {
        setPendingConfirmation({
          orderId: orderMatch[1],
          order: orders[orderMatch[1]],
          originalMessage: text,
        });
        return; // pause — don't call API until user confirms
      }
    }

    await callAPI(text);
  };

  // ── Confirmation Handlers ──────────────────────────────
  const handleConfirmRefund = async () => {
    if (!pendingConfirmation) return;
    const msg = pendingConfirmation.originalMessage;
    setPendingConfirmation(null);
    await callAPI(msg);
  };

  const handleCancelRefund = () => {
    setPendingConfirmation(null);
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content:
          'No problem — the refund request has been cancelled. Is there anything else I can help you with?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSendMessage();
  };

  const handleResolveTicket = () => {
    setEscalated(false);
    setShowAgentDashboard(false);
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content:
          'The support ticket has been marked as resolved by a specialist. Thank you for your patience — is there anything else I can help with?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // ── Dynamic Suggested Prompts ──────────────────────────
  const getSuggestedPrompts = () => {
    if (escalated) return [];

    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');

    if (lastAssistant?.tool === 'track_order') {
      return [
        {
          text: 'Request refund',
          prompt: `I'd like a refund for order #${lastAssistant.toolData?.order_id || ''}`,
        },
        { text: 'Track another order', prompt: 'Can you track a different order for me?' },
        { text: 'Speak to a human', prompt: "I'd like to speak with a human representative please." },
      ];
    }

    if (lastAssistant?.tool === 'process_refund') {
      return [
        { text: 'Check another order', prompt: 'Can you check on my other orders?' },
        { text: 'I have a question', prompt: 'I have another question about my account.' },
      ];
    }

    return [
      { text: 'Track Order #54321', prompt: 'Where is my order #54321?' },
      { text: 'Refund Order #1042', prompt: 'I want to request a refund for order #1042.' },
      {
        text: 'Speak to a human',
        prompt: 'I need to speak with a support representative immediately.',
      },
    ];
  };

  const suggestedPrompts = getSuggestedPrompts();

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#080c14] text-slate-100 overflow-hidden">
      {/* ─── LEFT SIDEBAR ─── */}
      <div className="w-72 border-r border-slate-800/40 bg-[#0a0f1a]/90 p-5 flex flex-col gap-5 shrink-0">
        {/* Session */}
        <div>
          <h2 className="text-[10px] font-semibold tracking-wider uppercase text-slate-600 mb-1.5">
            Session
          </h2>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <code className="text-[11px] text-indigo-300/80 select-all font-mono">
              {sessionId}
            </code>
          </div>
        </div>

        {/* Sentiment */}
        <SentimentGauge sentiment={sentiment} history={sentimentHistory} />

        {/* Escalation status */}
        <div
          className={`glass-card p-3 transition-all duration-300 ${
            escalated ? 'border-red-500/30' : ''
          }`}
        >
          <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Routing Status
          </h3>
          {escalated ? (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-red-400 font-bold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                ESCALATED
              </span>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Transferred to human agent queue. Chat context has been forwarded.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-indigo-300 font-medium">AI-Managed</span>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                Confidence sufficient. No escalation triggers detected.
              </p>
            </div>
          )}
        </div>

        {/* Tool logs */}
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Tool Execution Log
          </h3>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-0.5">
            {toolLogs.length === 0 ? (
              <p className="text-[11px] text-slate-700 italic">No tool calls in this session.</p>
            ) : (
              toolLogs.map((log, i) => <ToolLog key={i} log={log} />)
            )}
          </div>
        </div>
      </div>

      {/* ─── CENTER: CHAT ─── */}
      <div className="flex-1 flex flex-col bg-[#0b0f18] min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-slate-800/30 bg-[#0a0f1a]/40 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-indigo-500/20">
              FZ
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-100">Flowzint Support</h1>
              <p className="text-[10px] text-slate-500">AI-Powered Customer Care</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-slate-500">Online</span>
          </div>
        </div>

        {/* Messages pane */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} />
          ))}

          {/* Two-phase confirmation card */}
          {pendingConfirmation && !loading && (
            <ConfirmationCard
              order={pendingConfirmation.order}
              onConfirm={handleConfirmRefund}
              onCancel={handleCancelRefund}
            />
          )}

          {/* Context-aware loading indicator */}
          {loading && <LoadingIndicator phase={loadingPhase} />}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        {suggestedPrompts.length > 0 && (
          <div className="px-6 py-2 border-t border-slate-800/20 flex flex-wrap gap-2 items-center shrink-0">
            <span className="text-[10px] text-slate-600 uppercase font-semibold tracking-wider">
              Suggestions
            </span>
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                disabled={loading || escalated || !!pendingConfirmation}
                onClick={() => handleSendMessage(p.prompt)}
                className="text-[11px] bg-[#111827]/50 hover:bg-[#151b28] border border-slate-800/30 px-3 py-1.5 rounded-full text-indigo-300/80 hover:text-indigo-200 transition-all font-medium disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                {p.text}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="p-4 pt-2 border-t border-slate-800/20 bg-[#0a0f1a]/25 shrink-0">
          <div className="flex gap-2.5">
            <input
              id="chat-input"
              type="text"
              disabled={loading || escalated || !!pendingConfirmation}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                escalated
                  ? 'Chat escalated to human agent.'
                  : pendingConfirmation
                    ? 'Please confirm or cancel the pending action above.'
                    : 'Type your message...'
              }
              className="flex-1 bg-[#111827]/50 border border-slate-800/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/40 placeholder-slate-600 transition-colors disabled:opacity-40"
            />
            <button
              id="send-button"
              disabled={loading || escalated || !inputText.trim() || !!pendingConfirmation}
              onClick={() => handleSendMessage()}
              className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl px-5 font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* ─── RIGHT SIDEBAR ─── */}
      <div className="w-72 border-l border-slate-800/40 bg-[#0a0f1a]/90 p-5 flex flex-col shrink-0">
        {/* Tab toggle (only appears after escalation) */}
        {escalated && (
          <div className="flex gap-1 mb-4 p-0.5 bg-slate-900/50 rounded-lg">
            <button
              onClick={() => setShowAgentDashboard(false)}
              className={`flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-colors cursor-pointer ${
                !showAgentDashboard
                  ? 'bg-slate-800/70 text-slate-200'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              Database
            </button>
            <button
              onClick={() => setShowAgentDashboard(true)}
              className={`flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-colors cursor-pointer ${
                showAgentDashboard
                  ? 'bg-red-500/15 text-red-400'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              Agent View
            </button>
          </div>
        )}

        {showAgentDashboard && escalated ? (
          <AgentDashboard
            messages={messages}
            sentiment={sentiment}
            onResolve={handleResolveTicket}
          />
        ) : (
          <DatabaseExplorer orders={orders} />
        )}
      </div>
    </div>
  );
}
