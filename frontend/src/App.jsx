import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './components/ChatMessage';
import ConfirmationCard from './components/ConfirmationCard';
import LoadingIndicator from './components/LoadingIndicator';
import SentimentGauge from './components/SentimentGauge';
import AgentDashboard from './components/AgentDashboard';
import ToolLog from './components/ToolLog';
import DatabaseExplorer from './components/DatabaseExplorer';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const QUICK_REPLIES = [
  { label: 'Track Order' },
  { label: 'Talk to Human' },
];

function detectLoadingPhase(text) {
  const lower = text.toLowerCase();
  if (lower.includes('refund') || lower.includes('return') || lower.includes('money back'))
    return 'Processing refund request...';
  if (lower.includes('track') || lower.includes('where') || lower.includes('status'))
    return 'Searching order records...';
  if (lower.includes('human') || lower.includes('agent') || lower.includes('manager') || lower.includes('person'))
    return 'Connecting to support specialist...';
  return 'Thinking...';
}

export default function App() {
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substr(2, 9));
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm FlowBot. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('Thinking...');
  const [sentiment, setSentiment] = useState(0.5);
  const [sentimentHistory, setSentimentHistory] = useState([0.5]);
  const [escalated, setEscalated] = useState(false);
  const [toolLogs, setToolLogs] = useState([]);
  const [orders, setOrders] = useState({});
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [showAgentDashboard, setShowAgentDashboard] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        console.error('Speech recognition error', e);
        setIsListening(false);
      };
      // Important: Using functional state update inside a listener requires capturing it or just using the setState callback
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + (prev ? ' ' : '') + transcript);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Your browser doesn't support Speech Recognition. Try Chrome.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const playTTS = async (text) => {
    try {
      const res = await fetch(`${API_BASE}/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
      }
    } catch (err) {
      console.error('TTS playback failed:', err);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

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

      if (data.toolExecuted) {
        setToolLogs(prev => [
          {
            tool: data.toolExecuted,
            status: data.toolStatus,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
          ...prev,
        ]);
        fetchOrders();
      }

      if (data.pendingConfirmation) {
        setPendingConfirmation({
          orderId: data.pendingConfirmation.orderId,
          order: data.pendingConfirmation.order,
        });
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

      if (data.response) {
        playTTS(data.response);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error connecting to the server. Please ensure the backend is running on port 5000.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

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

    await callAPI(text);
  };

  const handleConfirmRefund = async () => {
    if (!pendingConfirmation) return;
    const orderId = pendingConfirmation.orderId;
    setPendingConfirmation(null);
    await callAPI(`[SYSTEM: User clicked Confirm Refund for order #${orderId}]`);
  };

  const handleCancelRefund = () => {
    if (!pendingConfirmation) return;
    const orderId = pendingConfirmation.orderId;
    setPendingConfirmation(null);
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: `No problem — I've cancelled the refund request for Order #${orderId}. Is there anything else I can help you with?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResolveTicket = () => {
    setEscalated(false);
    setShowAgentDashboard(false);
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: 'The support ticket has been marked as resolved. You can continue chatting with me — is there anything else I can help with?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleReturnToAI = () => {
    setEscalated(false);
    setShowAgentDashboard(false);
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: "You've been returned to AI support. How can I help you?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleQuickReply = (label) => {
    handleSendMessage(label);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-card)] text-[var(--text-primary)]">
      
      {/* ─── LEFT SIDEBAR ─── */}
      <div className="w-64 bg-[var(--bg-primary)] border-r border-[var(--border-light)] p-5 flex flex-col shrink-0">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
              <h1 className="text-lg font-bold">FlowBot</h1>
            </div>
            <div className="text-xs text-[var(--text-secondary)] font-bold">Customer Care Assistant</div>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="px-2 py-1 text-xs font-bold rounded-md hover:bg-black/5 dark:hover:bg-white/5 border border-[var(--border-light)]"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? 'Light' : 'Dark'}
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Session
          </h2>
          <code className="text-xs text-[var(--text-primary)] bg-[var(--border-light)] px-2 py-1 rounded">
            {sessionId}
          </code>
        </div>

        <div className="mb-6">
          <SentimentGauge sentiment={sentiment} history={sentimentHistory} />
        </div>

        <div className="mb-6 p-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            Status
          </h3>
          {escalated ? (
            <div>
              <span className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--status-red-txt)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--status-red-txt)' }}></span>
                ESCALATED
              </span>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-snug">
                Transferred to human agent.
              </p>
              <button
                onClick={handleReturnToAI}
                className="mt-2 text-xs font-semibold px-2 py-1 rounded-lg border cursor-pointer transition-all"
                style={{ background: 'var(--status-blue-bg)', color: 'var(--status-blue-txt)', borderColor: 'var(--status-blue-txt)' }}
              >
                ↩ Return to AI
              </button>
            </div>
          ) : (
            <div>
              <span className="text-sm font-bold text-[#039855]">AI-Managed</span>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-snug">
                No escalation triggers detected.
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            System Log
          </h3>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            {toolLogs.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] italic">No tool calls yet.</p>
            ) : (
              toolLogs.map((log, i) => <ToolLog key={i} log={log} />)
            )}
          </div>
        </div>
      </div>

      {/* ─── CENTER: CHAT ─── */}
      <div className="flex-1 flex flex-col items-center bg-[var(--bg-card)] relative min-w-0">
        
        {/* Messages pane */}
        <div className="w-full max-w-3xl flex-1 overflow-y-auto px-6 pt-8 pb-4 custom-scrollbar">
          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} />
          ))}

          {pendingConfirmation && !loading && (
            <ConfirmationCard order={pendingConfirmation.order} onConfirm={handleConfirmRefund} onCancel={handleCancelRefund} />
          )}

          {loading && <LoadingIndicator phase={loadingPhase} />}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="w-full max-w-3xl px-6 pb-6 pt-2 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)] to-transparent">
          
          {/* Quick replies */}
          <div className="flex gap-2 mb-3 overflow-x-auto custom-scrollbar">
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr.label}
                className="claude-btn-secondary px-3 py-1 text-xs font-medium whitespace-nowrap"
                onClick={() => handleQuickReply(qr.label)}
                disabled={loading || escalated || !!pendingConfirmation}
              >
                {qr.label}
              </button>
            ))}
          </div>

          <div className="claude-input-wrapper p-3 relative flex items-end min-h-[56px]">
            <textarea
              disabled={loading || !!pendingConfirmation}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                pendingConfirmation ? 'Please confirm action above.' :
                escalated ? 'Chat continues — human agent is also monitoring.' :
                isListening ? 'Listening...' :
                'Reply to FlowBot...'
              }
              className="claude-input flex-1 resize-none h-[24px] max-h-[120px] text-sm py-0.5 leading-snug"
              style={{ opacity: loading ? 0.5 : 1 }}
              rows={1}
            />
            <button
              className="ml-2 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all"
              onClick={toggleListening}
              disabled={loading || !!pendingConfirmation}
              style={{
                background: isListening ? 'var(--status-red-bg)' : 'var(--bg-primary)',
                color: isListening ? 'var(--status-red-txt)' : 'var(--text-secondary)',
                borderColor: isListening ? 'var(--status-red-txt)' : 'var(--border-light)'
              }}
              title="Dictate message"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C10.3431 2 9 3.34315 9 5V11C9 12.6569 10.3431 14 12 14C13.6569 14 15 12.6569 15 11V5C15 3.34315 13.6569 2 12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 10V11C19 14.866 15.866 18 12 18M5 10V11C5 14.866 8.13401 18 12 18M12 18V22M8 22H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="claude-btn-primary ml-2 w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              onClick={() => handleSendMessage()}
              disabled={loading || !inputText.trim() || !!pendingConfirmation}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ─── RIGHT SIDEBAR (For Escalation/DB) ─── */}
      <div className="w-72 bg-[var(--bg-primary)] border-l border-[var(--border-light)] p-5 flex flex-col shrink-0">
        {escalated && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setShowAgentDashboard(false)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md border ${
                !showAgentDashboard ? 'bg-[var(--bg-card)] border-[var(--border-light)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:bg-black/5'
              }`}
            >
              Database
            </button>
            <button
              onClick={() => setShowAgentDashboard(true)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md border ${
                showAgentDashboard ? 'bg-[var(--bg-card)] border-[var(--border-light)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:bg-black/5'
              }`}
            >
              Agent View
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          {showAgentDashboard && escalated ? (
            <AgentDashboard messages={messages} sentiment={sentiment} onResolve={handleResolveTicket} />
          ) : (
            <DatabaseExplorer orders={orders} />
          )}
        </div>
      </div>
    </div>
  );
}
