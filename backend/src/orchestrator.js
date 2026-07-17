const { Groq } = require('groq-sdk');
const { toolsDefinition, executeTool, mockOrders } = require('./tools/mockTools');
const { generateSystemPrompt } = require('../../ai_core/prompts');


let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} else {
  console.log("No GROQ_API_KEY found in env. Running in SIMULATED Agent Mode.");
}

// Memory Store: Session ID -> Array of Messages
const memoryStore = {};

function getSessionHistory(sessionId) {
  if (!memoryStore[sessionId]) {
    memoryStore[sessionId] = [];
  }
  return memoryStore[sessionId];
}

function getSessionMeta(sessionId) {
  if (!memoryStore[sessionId]) {
    memoryStore[sessionId] = [];
  }
  if (!memoryStore[sessionId].meta) {
    memoryStore[sessionId].meta = {
      unresolvedAttempts: 0,
      lastIntent: null,
      pendingConfirmation: null 
    };
  }
  return memoryStore[sessionId].meta;
}

function detectIntent(message) {
  const m = message.toLowerCase();
  if (m.includes('refund') || m.includes('money back') || m.includes('cancel')) return 'refund';
  if (m.includes('track') || m.includes('where') || m.includes('status') || m.includes('package')) return 'tracking';
  if (m.includes('human') || m.includes('agent') || m.includes('person') || m.includes('manager') || m.includes('representative')) return 'escalate';
  return 'general';
}

function cleanResponse(text) {
  if (!text) return text;
  return text
    .replace(/<function=[\w]+>[\s\S]*?(?:<\/function>|$)/gm, '') // standard format
    .replace(/\{[\s\S]*?"order_id"[\s\S]*?\}"?/g, '')            // catches trailing " too
    .replace(/```[\s\S]*?```/g, '')                               // code blocks
    .replace(/\n{3,}/g, '\n\n')                                   // clean up extra newlines
    .trim();
}

function calculateSentiment(message) {
  const m = message.toLowerCase();

  const negativeStrong = [
    'terrible', 'worst', 'hate', 'furious', 'useless', 'pathetic',
    'ridiculous', 'disgusting', 'awful', 'horrible', 'scam', 'fraud'
  ];
  const negativeMild = [
    'bad', 'angry', 'annoyed', 'frustrated', 'upset', 'disappointed',
    'tired', 'waiting', 'slow', 'late', 'delay', 'wrong', 'broken',
    'not working', 'still', 'again', 'already', 'never', 'unacceptable',
    'ridiculous', 'issue', 'problem', 'error', 'failed', 'missing'
  ];
  const positive = [
    'great', 'awesome', 'good', 'thank', 'perfect', 'nice',
    'appreciate', 'excellent', 'happy', 'satisfied', 'love', 'wonderful'
  ];

  // Caps lock = yelling = frustration signal
  const capsRatio = (message.match(/[A-Z]/g) || []).length / (message.length || 1);
  const isYelling = capsRatio > 0.4 && message.length > 4;

  // Exclamation marks = frustration
  const exclamations = (message.match(/!/g) || []).length;

  let score = 0.6; // start slightly positive (neutral customer)

  negativeStrong.forEach(w => { if (m.includes(w)) score -= 0.2; });
  negativeMild.forEach(w => {  if (m.includes(w)) score -= 0.1; });
  positive.forEach(w => {      if (m.includes(w)) score += 0.12; });

  if (isYelling)    score -= 0.2;
  if (exclamations >= 2) score -= 0.1;

  return Math.max(0, Math.min(1, score));
}

async function processMessage(sessionId, userMessage) {
  const history = getSessionHistory(sessionId);
  const sentiment = calculateSentiment(userMessage);
  const meta = getSessionMeta(sessionId);

  // ── GREETING INTERCEPT ─────────────────────────────────────────────────────
  // Handle simple greetings deterministically — never let the LLM refuse them.
  const isGreeting = /^\s*(hi+|hey+|hello+|howdy|good\s*(morning|afternoon|evening|day)|sup|yo|hiya|greetings)\s*[!.,?]?\s*$/i.test(userMessage);
  if (isGreeting) {
    const greetingReplies = [
      "Hey there! 👋 How can I help you today? I can track your orders, process refunds, or connect you with a specialist.",
      "Hello! Great to hear from you. What can I help you with — order tracking, a refund, or something else?",
      "Hi! Welcome to FlowZint support. How can I assist you today?",
    ];
    const reply = greetingReplies[Math.floor(Math.random() * greetingReplies.length)];
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: reply });
    return {
      response: reply,
      sentiment: Math.max(sentiment, 0.6),
      toolExecuted: null,
      toolStatus: null,
      toolData: null,
      escalated: false,
      escalationReason: null
    };
  }
  // ── END GREETING INTERCEPT ─────────────────────────────────────────────────

  // Append user message to history
  history.push({ role: 'user', content: userMessage });
  if (history.length > 12) history.shift();

  let finalResponseText = '';
  let toolExecuted = null;
  let toolStatus = null;
  let toolData = null;
  let escalated = false;

  // ── 1. REAL LLM MODE ────────────────────────────────────────────────────
  if (groq) {
    try {
      const systemMessage = {
        role: 'system',
        content: generateSystemPrompt({
          userName: "Customer",
          recentOrders: Object.values(mockOrders).map(o => ({
            id: o.order_id,
            items: [o.item],
            status: o.status
          })),
          sentimentScore: sentiment * 10,
          unresolvedAttempts: meta?.unresolvedAttempts || 0
        })
      };

      const messages = [systemMessage, ...history];

      let completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages,
        tools: toolsDefinition,
        tool_choice: 'auto',
        temperature: 0.3
      });

      let responseMessage = completion.choices[0].message;

      // ── RETRY: LLM wrote function syntax in plain text instead of tool_calls
      if (!responseMessage.tool_calls && responseMessage.content?.includes('<function=')) {
        const retryCompletion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            systemMessage,
            ...history,
            {
              role: 'user',
              content: '[SYSTEM: You wrote a tool call as plain text. Use the proper tool_calls API mechanism instead. Retry now.]'
            }
          ],
          tools: toolsDefinition,
          tool_choice: 'auto',
          temperature: 0.1
        });
        responseMessage = retryCompletion.choices[0].message;
      }

      // ── TOOL CALL HANDLER ────────────────────────────────────────────────
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

          // Execute tool normally
          toolExecuted = name;
          const result = await executeTool(name, args);
          toolStatus = result.success ? 'Success' : 'Failed';
          if (result.data) toolData = result.data;

          if (result.escalated) escalated = true;

          const updatedMessages = [
            systemMessage,
            ...history,
            responseMessage,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              name,
              content: JSON.stringify(result) +
                "\n\nIMPORTANT: You now have all the data you need. Do NOT call any more tools. Write your final response using only this data. Use exact values — exact dates, prices, statuses. No vague language."
            }
          ];

          const finalCompletion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: updatedMessages,
            temperature: 0.2
          });

          finalResponseText = cleanResponse(finalCompletion.choices[0].message.content);

      } else {
        // ── NO TOOL CALL ──────────────────────────────────────────────────
        finalResponseText = cleanResponse(responseMessage.content);
      }

    } catch (error) {
      console.error("Error in real LLM completion:", error);
      const fallback = await simulateLocalResponse(userMessage, history);
      finalResponseText = cleanResponse(
        "I'm having trouble connecting to my cognitive services. Let me fall back to automatic local response: " + fallback.responseText
      );
    }

  // ── 2. SIMULATED MODE ────────────────────────────────────────────────────
  } else {
    const simulation = await simulateLocalResponse(userMessage, history);
    finalResponseText = simulation.responseText;
    toolExecuted = simulation.toolExecuted;
    toolStatus = simulation.toolStatus;
    if (simulation.toolData) toolData = simulation.toolData;
    escalated = simulation.escalated;
  }

  // Push assistant response to history
  history.push({ role: 'assistant', content: finalResponseText });

  // ── UNRESOLVED ATTEMPTS COUNTER ──────────────────────────────────────────
  const currentIntent = detectIntent(userMessage);

  if (toolExecuted && toolExecuted !== 'escalate_to_human') {
    meta.unresolvedAttempts = 0;
    meta.lastIntent = null;
  } else if (currentIntent === meta.lastIntent && !toolExecuted) {
    meta.unresolvedAttempts += 1;
  } else {
    meta.unresolvedAttempts = 0;
    meta.lastIntent = currentIntent;
  }

  // ── THREE-RULE ESCALATION ENGINE ─────────────────────────────────────────
  const sentimentTriggered = sentiment < 0.3;
  const loopTriggered      = meta.unresolvedAttempts >= 2;
  const explicitRequest    = detectIntent(userMessage) === 'escalate';
  const shouldEscalate     = escalated || sentimentTriggered || loopTriggered || explicitRequest;

  const escalationReason = escalated         ? 'tool_triggered'
                         : sentimentTriggered ? 'low_sentiment'
                         : loopTriggered      ? 'loop_detected'
                         : explicitRequest    ? 'user_requested'
                         : null;

  let returnPayload = {
    response: finalResponseText,
    sentiment,
    toolExecuted,
    toolStatus,
    toolData,
    escalated: shouldEscalate,
    escalationReason
  };

  if (toolExecuted === 'request_refund_confirmation' && toolData) {
    returnPayload.pendingConfirmation = {
      orderId: toolData.order_id,
      order: toolData
    };
  }

  return returnPayload;
}

async function simulateLocalResponse(message, history) {
  const lowercase = message.toLowerCase();
  let responseText = '';
  let toolExecuted = null;
  let toolStatus = null;
  let escalated = false;

  // Rules for refund
  if (lowercase.includes('refund')) {
    const orderMatch = message.match(/\b(1042|54321)\b/);
    if (orderMatch) {
      const orderId = orderMatch[0];
      toolExecuted = 'process_refund';
      const result = await executeTool('process_refund', { order_id: orderId, reason: "Customer requested via chat" });
      toolStatus = result.success ? 'Success' : 'Failed';
      responseText = result.success 
        ? `I have successfully processed a refund of $45.99 for your Order #${orderId} (Medium Blue Jacket). You should see it in your account in 2-3 business days.`
        : `I was unable to process that refund. Error: ${result.error}`;
    } else {
      responseText = "I can certainly help you with a refund. Could you please provide your 4-digit or 5-digit Order ID?";
    }
  } 
  // Rules for tracking
  else if (lowercase.includes('track') || lowercase.includes('where') || lowercase.includes('status')) {
    const orderMatch = message.match(/\b(1042|54321)\b/);
    if (orderMatch) {
      const orderId = orderMatch[0];
      toolExecuted = 'track_order';
      const result = await executeTool('track_order', { order_id: orderId });
      toolStatus = result.success ? 'Success' : 'Failed';
      if (result.success) {
        const order = result.data;
        responseText = `Sure! Order #${orderId} (${order.item}) is currently **${order.status}** via ${order.carrier}. Expected delivery date is ${order.delivery_date}.`;
      } else {
        responseText = `I couldn't locate that order. ${result.error}`;
      }
    } else {
      responseText = "I'd be glad to track your package! Could you please provide your Order ID?";
    }
  } 
  // Escalation triggers
  else if (lowercase.includes('human') || lowercase.includes('agent') || lowercase.includes('person') || lowercase.includes('manager') || lowercase.includes('representative')) {
    toolExecuted = 'escalate_to_human';
    const result = await executeTool('escalate_to_human', { reason: "User requested human agent" });
    toolStatus = 'Success';
    escalated = true;
    responseText = "Connecting you to a support specialist now. One moment please, they are receiving the summary of our chat.";
  } 
  // Standard conversational greetings & FAQs
  else if (lowercase.includes('hello') || lowercase.includes('hi') || lowercase.includes('hey')) {
    responseText = "Hello! I am your Flowzint AI customer care assistant. How can I help you today? I can track your orders or process refunds.";
  } else {
    responseText = "I'm not completely sure about that. Could you please specify if you'd like to check order tracking, request a refund, or be connected to a human representative?";
  }

  return {
    responseText,
    toolExecuted,
    toolStatus,
    escalated
  };
}

module.exports = {
  processMessage
};
