// Mock Database / State
const mockOrders = {
  "1042": {
    order_id: "1042",
    status: "Delivered",
    item: "Medium Blue Jacket",
    price: 45.99,
    delivery_date: "2026-07-10",
    carrier: "UPS",
    refunded: false
  },
  "54321": {
    order_id: "54321",
    status: "In Transit",
    item: "Wireless Headphones",
    price: 99.99,
    delivery_date: "2026-07-20",
    carrier: "FedEx",
    refunded: false
  },
  "78903": {
    order_id: "78903",
    status: "Delivered",
    item: "Running Shoes (Size 10)",
    price: 134.50,
    delivery_date: "2026-07-08",
    carrier: "DHL",
    refunded: false
  },
  "23456": {
    order_id: "23456",
    status: "Processing",
    item: "Smart Watch Series X",
    price: 299.00,
    delivery_date: "2026-07-25",
    carrier: "FedEx",
    refunded: false
  },
  "67890": {
    order_id: "67890",
    status: "Delivered",
    item: "Coffee Maker Deluxe",
    price: 79.99,
    delivery_date: "2026-07-05",
    carrier: "UPS",
    refunded: true
  },
  "11223": {
    order_id: "11223",
    status: "Out for Delivery",
    item: "Mechanical Keyboard",
    price: 159.00,
    delivery_date: "2026-07-17",
    carrier: "USPS",
    refunded: false
  },
  "99887": {
    order_id: "99887",
    status: "Cancelled",
    item: "Portable Bluetooth Speaker",
    price: 59.95,
    delivery_date: null,
    carrier: "N/A",
    refunded: true
  },
  "44501": {
    order_id: "44501",
    status: "In Transit",
    item: "Ergonomic Office Chair",
    price: 349.99,
    delivery_date: "2026-07-22",
    carrier: "DHL",
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
