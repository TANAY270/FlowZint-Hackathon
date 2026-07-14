require('dotenv').config({ path: '../.env' }); // Make sure we grab the key from root
const { generateSystemPrompt } = require('./prompts');
const toolsDefinition = require('./tools.json');

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function testLLM() {
    if (!GROQ_API_KEY) {
        console.error("Missing GROQ_API_KEY in .env");
        return;
    }

    // Mock User State
    const userState = {
        userName: "Nishtha",
        sentimentScore: 2, // Very frustrated
        recentOrders: [
            { id: "ORD-999", status: "Delayed", items: ["Mechanical Keyboard"] }
        ]
    };

    const messages = [
        { role: "system", content: generateSystemPrompt(userState) },
        { role: "user", content: "i am satisfied with the product" } // Notice we didn't give the order ID!
    ];

    console.log("Sending request to Groq API...");

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // Use Llama 3.3 for latest support
                messages: messages,
                tools: toolsDefinition.tools,
                tool_choice: "auto"
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("API Error:", data.error);
            return;
        }

        const message = data.choices[0].message;
        console.log("\n--- LLM Response ---");
        
        if (message.tool_calls) {
            console.log("The LLM decided to call a tool!");
            console.log(JSON.stringify(message.tool_calls, null, 2));
        } else {
            console.log("Text Response:", message.content);
        }

    } catch (err) {
        console.error("Failed to connect to Groq:", err);
    }
}

testLLM();
