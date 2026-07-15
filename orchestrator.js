const { Groq } = require('groq-sdk');
const { toolsDefinition, executeTool } = require('./tools/mockTools');

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
  if (!memoryStore[sessionId].meta) {
    memoryStore[sessionId].meta = {
      unresolvedAttempts: 0,
      lastIntent: null
    };
  }
  return memoryStore[sessionId].meta;
}


function calculateSentiment(message) {
  const lowercase = message.toLowerCase();
  const negativeWords = ['terrible', 'bad', 'worst', 'hate', 'furious', 'angry', 'sucks', 'stupid', 'useless', 'human', 'agent', 'person', 'manager'];
  const positiveWords = ['great', 'awesome', 'good', 'thank', 'perfect', 'nice', 'appreciate'];
  
  let score = 0.5; // neutral default
  
  negativeWords.forEach(word => {
    if (lowercase.includes(word)) score -= 0.15;
  });
  positiveWords.forEach(word => {
    if (lowercase.includes(word)) score += 0.15;
  });
  
  // Cap between 0 and 1
  return Math.max(0, Math.min(1, score));
}

async function processMessage(sessionId, userMessage) {
  const history = getSessionHistory(sessionId);
  const sentiment = calculateSentiment(userMessage);
  
  // Append user message to history
  history.push({ role: 'user', content: userMessage });
  if (history.length > 12) {
    history.shift(); // keep sliding window
  }

  let finalResponseText = '';
  let toolExecuted = null;
  let toolStatus = null;
  let toolData = null;
  let escalated = false;

  // 1. REAL LLM MODE
  if (groq) {
    try {
      const systemMessage = {
        role: 'system',
        content: `You are a competent AI customer care agent for Flowzint. You resolve queries, trigger actions when requested using tools, and escalate to a human only when confidence is low or the user is frustrated. Use the tools provided when the user requests tracking information or refunds. Be helpful, clear, and request clarification if details (like order ID) are missing.`
      };

      const messages = [systemMessage, ...history];

      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: messages,
        tools: toolsDefinition,
        tool_choice: 'auto',
        temperature: 0.3
      });

      const responseMessage = completion.choices[0].message;

      // Handle tool calls
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        toolExecuted = name;
        const result = await executeTool(name, args);
        toolStatus = result.success ? 'Success' : 'Failed';
        toolData = result.data || null;
        
        if (result.escalated) {
          escalated = true;
        }

        // Send tool results back to LLM for final response grounding
        const updatedMessages = [
          systemMessage,
          ...history,
          responseMessage,
          {
            role: 'tool',
            tool_call_id: toolCall.id,
            name: name,
            content: JSON.stringify(result)
          }
        ];

        const finalCompletion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: updatedMessages
        });

        finalResponseText = finalCompletion.choices[0].message.content;
      } else {
        finalResponseText = responseMessage.content;
      }
    } catch (error) {
      console.error("Error in real LLM completion:", error);
      finalResponseText = "I'm having trouble connecting to my cognitive services. Let me fall back to automatic local response: " + (await simulateLocalResponse(userMessage, history)).responseText;
    }
  } 
  // 2. SIMULATED MODE (NO API KEY / FALLBACK)
  else {
    const simulation = await simulateLocalResponse(userMessage, history);
    finalResponseText = simulation.responseText;
    toolExecuted = simulation.toolExecuted;
    toolStatus = simulation.toolStatus;
    toolData = simulation.toolData;
    escalated = simulation.escalated;
  }

  // Push assistant response to history
  history.push({ role: 'assistant', content: finalResponseText });

  return {
    response: finalResponseText,
    sentiment: sentiment,
    toolExecuted: toolExecuted,
    toolStatus: toolStatus,
    toolData: toolData,
    escalated: escalated || sentiment < 0.3
  };
}

async function simulateLocalResponse(message, history) {
  const lowercase = message.toLowerCase();
  let responseText = '';
  let toolExecuted = null;
  let toolStatus = null;
  let toolData = null;
  let escalated = false;

  // Rules for refund
  if (lowercase.includes('refund')) {
    const orderMatch = message.match(/\b(1042|54321)\b/);
    if (orderMatch) {
      const orderId = orderMatch[0];
      toolExecuted = 'process_refund';
      const result = await executeTool('process_refund', { order_id: orderId, reason: "Customer requested via chat" });
      toolStatus = result.success ? 'Success' : 'Failed';
      toolData = result.data || null;
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
      toolData = result.data || null;
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
    toolData,
    escalated
  };
}

module.exports = {
  processMessage
};
