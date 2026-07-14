import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substr(2, 9));
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your Flowzint AI customer care assistant. How can I help you today? You can ask me to track your orders or request a refund.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentiment, setSentiment] = useState(0.5); // 0 to 1
  const [escalated, setEscalated] = useState(false);
  const [toolLogs, setToolLogs] = useState([]);
  const [orders, setOrders] = useState({});

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Fetch initial orders database state from backend
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch mock database state:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Send message to server
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) setInputText('');

    // Append user message
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          message: text
        })
      });

      if (!res.ok) throw new Error('Network response error');

      const data = await res.json();

      // Log tool executions if they occurred
      if (data.toolExecuted) {
        setToolLogs(prev => [
          {
            tool: data.toolExecuted,
            status: data.toolStatus,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          },
          ...prev
        ]);
        // Refresh database visualizer state
        fetchOrders();
      }

      setSentiment(data.sentiment);
      if (data.escalated) setEscalated(true);

      // Append assistant response
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tool: data.toolExecuted,
          toolStatus: data.toolStatus
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error connecting to the orchestrator. Please make sure the backend is running.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          error: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  // Helper to determine sentiment color
  const getSentimentDetails = () => {
    if (sentiment > 0.6) return { text: 'Positive', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
    if (sentiment < 0.4) return { text: 'Frustrated / Urgent', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
    return { text: 'Neutral', color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
  };

  const sentimentDetails = getSentimentDetails();

  const suggestedPrompts = [
    { text: "Track Order #54321", prompt: "Where is my order #54321?" },
    { text: "Refund Order #1042", prompt: "I want to request a refund for order #1042." },
    { text: "Speak to human", prompt: "Connect me to a manager immediately, I am having issues." }
  ];

  return (
    <div className="flex h-screen bg-[#070b13] text-slate-100 overflow-hidden">
      {/* LEFT SIDEBAR: Agent Metrics & Diagnostics */}
      <div className="w-80 border-r border-slate-800 bg-[#0c1220]/80 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-400 mb-1">Active Session</h2>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <code className="text-xs text-indigo-300 select-all">{sessionId}</code>
          </div>
        </div>

        {/* Sentiment Gauge */}
        <div className="p-4 rounded-xl border bg-slate-900/50 border-slate-800/80">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Live Sentiment Monitor</h3>
          <div className="flex justify-between items-center mb-1.5">
            <span className={`text-sm font-bold ${sentimentDetails.color}`}>{sentimentDetails.text}</span>
            <span className="text-xs text-slate-500">Score: {(sentiment * 10).toFixed(1)}/10</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${sentiment < 0.4 ? 'bg-red-500' : sentiment > 0.6 ? 'bg-green-500' : 'bg-slate-400'}`} 
              style={{ width: `${sentiment * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Escalation Status */}
        <div className={`p-4 rounded-xl border transition-all duration-300 ${
          escalated 
            ? 'bg-red-500/10 border-red-500/30' 
            : 'bg-indigo-500/5 border-indigo-500/10'
        }`}>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Human Handoff Trigger</h3>
          {escalated ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-red-400 font-bold flex items-center gap-1.5">
                ⚠️ ESCALATED TO LIVE QUEUE
              </span>
              <p className="text-xs text-slate-400">
                A human agent is reviewing the summarized chat context. Direct response pipeline is active.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-indigo-300 font-medium">🤖 Under AI Management</span>
              <p className="text-xs text-slate-500">
                Confidence is high. System is successfully resolving customer intent.
              </p>
            </div>
          )}
        </div>

        {/* Tool Execution Logs */}
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tool Execution Log</h3>
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
            {toolLogs.length === 0 ? (
              <p className="text-xs text-slate-600 italic">No tools triggered yet in this session.</p>
            ) : (
              toolLogs.map((log, i) => (
                <div key={i} className="text-xs p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col gap-1">
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-indigo-400 font-bold">{log.tool}()</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      log.status === 'Success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CENTER: Chat Interface */}
      <div className="flex-1 flex flex-col bg-[#0b0f19]">
        {/* Header */}
        <div className="h-16 border-b border-slate-800 bg-[#0c1220]/60 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              FZ
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100">Customer Support Assistant</h1>
              <p className="text-xs text-indigo-400">Context-Aware AI Agent</p>
            </div>
          </div>
        </div>

        {/* Messages Pane */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-2xl flex flex-col gap-1">
                {/* Message Bubble */}
                <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : msg.error
                      ? 'bg-red-500/10 border-red-500/30 text-red-200'
                      : 'bg-slate-900/80 border-slate-800/80 text-slate-100 shadow-sm'
                }`}>
                  {msg.content}
                </div>

                {/* Tool notification indicator */}
                {msg.tool && (
                  <div className="flex items-center gap-1.5 px-2 text-[11px] text-indigo-400 font-mono mt-0.5">
                    <span>⚡ Executed: <strong>{msg.tool}</strong></span>
                    <span className={`h-1.5 w-1.5 rounded-full ${msg.toolStatus === 'Success' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  </div>
                )}

                {/* Time */}
                <span className={`text-[10px] text-slate-500 px-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex flex-col gap-1.5">
                <div className="bg-slate-900/60 border border-slate-800/50 p-4 rounded-2xl flex items-center gap-3">
                  <div className="flex space-x-1">
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-xs text-slate-400">Processing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Bar */}
        <div className="px-8 py-3 bg-slate-950/20 border-t border-slate-900 flex flex-wrap gap-2 items-center">
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Try:</span>
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              disabled={loading || escalated}
              onClick={() => handleSendMessage(p.prompt)}
              className="text-xs bg-slate-900 hover:bg-slate-800 active:bg-slate-800 border border-slate-800/80 px-3 py-1.5 rounded-full text-indigo-300 hover:text-indigo-200 transition-all font-medium disabled:opacity-50 disabled:pointer-events-none"
            >
              {p.text}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-8 pt-2 border-t border-slate-900 bg-[#0c1220]/30">
          <div className="flex gap-3">
            <input
              type="text"
              disabled={loading || escalated}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={escalated ? "Agent connected. Please refer to dashboard instructions." : "Type your query here (e.g., 'Where is order 54321?')..."}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500 transition-colors disabled:opacity-50"
            />
            <button
              disabled={loading || escalated || !inputText.trim()}
              onClick={() => handleSendMessage()}
              className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl px-6 font-semibold text-sm transition-all shadow-lg flex items-center justify-center disabled:opacity-55 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Live Database Explorer */}
      <div className="w-80 border-l border-slate-800 bg-[#0c1220]/80 p-6 flex flex-col">
        <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-400 mb-4">Live Database Explorer</h2>
        <p className="text-xs text-slate-500 mb-4">
          This pane displays real-time changes to the mock backend order records when tool-calls occur.
        </p>

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 font-mono text-xs pr-1">
          {Object.keys(orders).length === 0 ? (
            <span className="text-slate-600 italic">Database status disconnected.</span>
          ) : (
            Object.values(orders).map((order) => (
              <div key={order.order_id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                  <span className="text-indigo-300 font-bold">Order #{order.order_id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    order.status === 'Delivered' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-[11px] text-slate-400">
                  <div><span className="text-slate-500">Item:</span> {order.item}</div>
                  <div><span className="text-slate-500">Price:</span> ${order.price}</div>
                  <div><span className="text-slate-500">Carrier:</span> {order.carrier}</div>
                  <div><span className="text-slate-500">Delivery:</span> {order.delivery_date}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-slate-500">Refunded:</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${order.refunded ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    <span className={order.refunded ? 'text-green-400 font-bold' : 'text-slate-500'}>
                      {order.refunded ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
