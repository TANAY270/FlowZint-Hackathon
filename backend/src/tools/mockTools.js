// Mock Database / State
const mockOrders = {
  "54321": {
    order_id: "54321",
    status: "In Transit",
    item: "Wireless Headphones",
    price: 99.99,
    delivery_date: "2026-07-16",
    carrier: "FedEx"
  },
  "1042": {
    order_id: "1042",
    status: "Delivered",
    item: "Medium Blue Jacket",
    price: 45.99,
    delivery_date: "2026-07-10",
    carrier: "UPS",
    refunded: false
  }
};

// Tool schemas for LLM function calling
const toolsDefinition = [
  {
    type: "function",
    function: {
      name: "track_order",
      description: "Get real-time tracking information for a specific order using the 5-digit Order ID.",
      parameters: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "The 5-digit order identifier, e.g., '54321' or '1042'."
          }
        },
        required: ["order_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "request_refund_confirmation",
      description: "Trigger a UI confirmation dialog for a refund. Use this when the customer asks for a refund. DO NOT use this if you receive a SYSTEM message stating the user has already confirmed.",
      parameters: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "The order identifier."
          }
        },
        required: ["order_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "process_refund",
      description: "Initiate a full or partial refund for an order. ONLY use this AFTER the user has clicked Confirm Refund in the UI and you have received a [SYSTEM: User clicked Confirm Refund] message.",
      parameters: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "The order identifier."
          },
          reason: {
            type: "string",
            description: "The reason given by the customer for the refund."
          }
        },
        required: ["order_id", "reason"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description: "Transfer the conversation to a live human support specialist when confidence is low, the customer is highly frustrated, or explicitly requests a manager/human.",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Summary of why the conversation is being escalated (e.g., 'Frustrated customer demanding manager' or 'Complex payment error')."
          }
        },
        required: ["reason"]
      }
    }
  }
];

// Tool execution logic
async function executeTool(name, args) {
  console.log(`Executing tool: ${name} with args:`, args);
  switch (name) {
    case "track_order": {
      const order = mockOrders[args.order_id];
      if (order) {
        return {
          success: true,
          data: order
        };
      }
      return {
        success: false,
        error: `Order ID #${args.order_id} not found in database.`
      };
    }
    case "request_refund_confirmation": {
      const order = mockOrders[args.order_id];
      if (!order) {
        return {
          success: false,
          error: `Order ID #${args.order_id} not found in database.`
        };
      }
      return {
        success: true,
        message: "Confirmation UI sent. Awaiting user's explicit confirmation via UI.",
        data: order
      };
    }
    case "process_refund": {
      const order = mockOrders[args.order_id];
      if (!order) {
        return {
          success: false,
          error: `Order ID #${args.order_id} not found.`
        };
      }
      if (order.refunded) {
        return {
          success: false,
          error: `Order #${args.order_id} has already been refunded.`
        };
      }
      order.refunded = true;
      return {
        success: true,
        message: `Successfully processed refund of $${order.price} for Order #${args.order_id}.`,
        data: order
      };
    }
    case "escalate_to_human": {
      return {
        success: true,
        escalated: true,
        message: `Connecting to a live agent. Brief context: ${args.reason}.`
      };
    }
    default:
      return {
        success: false,
        error: `Unknown tool: ${name}`
      };
  }
}

module.exports = {
  toolsDefinition,
  executeTool,
  mockOrders
};
