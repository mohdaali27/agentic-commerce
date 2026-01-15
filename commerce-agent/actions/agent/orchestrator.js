/**
 * AI Agent Orchestrator
 * Handles conversation flow, intent detection, and tool execution
 */

const { createLLMProvider } = require('../utils/llm-provider');
const { ToolAdapter } = require('../tools/adapter');

class AgentOrchestrator {
  constructor(config = {}) {
    this.llmProvider = createLLMProvider(config);
    this.toolAdapter = new ToolAdapter(config);
    this.systemPrompt = this.buildSystemPrompt();
    
    console.log('[AgentOrchestrator] Instance created');
  }

  async initialize() {
    await this.toolAdapter.initialize();
    console.log('[AgentOrchestrator] ✅ Initialized');
  }

  buildSystemPrompt() {
    return `You are a helpful AI shopping assistant for an e-commerce store. Your role is to help customers:

1. Find products they're looking for
2. Get detailed product information
3. Add products to their shopping cart
4. View and manage their cart

Available tools:
- search_products: Search the product catalog
- get_product_details: Get details about a specific product
- create_cart: Create a new shopping cart
- add_to_cart: Add products to the cart
- get_cart: View cart contents
- update_cart_item: Update item quantities
- remove_cart_item: Remove items from cart

Guidelines:
- Be friendly, helpful, and conversational
- Always confirm before adding items to cart
- Provide clear product information (price, availability)
- Suggest alternatives if products are out of stock
- Keep responses concise but informative
- Use tools proactively to help the customer

When the user wants to search for products, use search_products.
When they want to add something to cart, use add_to_cart (make sure you have a cartId).
If no cart exists, create one first with create_cart.`;
  }

  /**
   * Process user message
   */
  async processMessage(userMessage, conversationHistory = [], context = {}) {
    console.log(`[AgentOrchestrator] Processing: "${userMessage}"`);

    try {
      // Analyze intent
      const intent = await this.analyzeIntent(userMessage, conversationHistory);
      console.log(`[AgentOrchestrator] Intent: ${intent.type}`);

      let response;
      let toolsUsed = [];

      if (intent.requiresTools) {
        // Execute tools
        const toolResults = await this.executeTools(intent, context);
        toolsUsed = toolResults.map(r => r.toolName);

        // Generate response with tool results
        response = await this.generateResponseWithTools(
          userMessage,
          toolResults,
          conversationHistory
        );
      } else {
        // Generate direct response
        response = await this.generateDirectResponse(
          userMessage,
          conversationHistory
        );
      }

      console.log('[AgentOrchestrator] ✅ Response generated');

      return {
        response: response.content,
        toolsUsed,
        intent: intent.type,
        usage: response.usage,
      };

    } catch (error) {
      console.error('[AgentOrchestrator] ❌ Error:', error);
      throw error;
    }
  }

  /**
   * Analyze user intent
   */
  async analyzeIntent(userMessage, conversationHistory = []) {
    const messages = [
      {
        role: 'system',
        content: `Analyze the user's message and determine their intent. Respond ONLY with valid JSON.

Intent types:
- product_search: User wants to find products
- product_details: User wants details about a specific product
- add_to_cart: User wants to add something to cart
- view_cart: User wants to see their cart
- cart_management: User wants to update/remove cart items
- general_question: General inquiry
- greeting: User is greeting

JSON format:
{
  "type": "intent_type",
  "requiresTools": true/false,
  "suggestedTools": ["tool1", "tool2"],
  "parameters": {}
}`,
      },
      {
        role: 'user',
        content: `User message: "${userMessage}"`,
      },
    ];

    try {
      const result = await this.llmProvider.generateCompletion(messages, {
        temperature: 0.3,
        maxTokens: 300,
      });

      // Extract JSON from response
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const intent = JSON.parse(jsonMatch[0]);
        return intent;
      }

      // Fallback
      return {
        type: 'general_question',
        requiresTools: false,
        suggestedTools: [],
        parameters: {},
      };

    } catch (error) {
      console.error('[AgentOrchestrator] Intent analysis failed:', error);
      
      // Simple fallback intent detection
      const lowerMessage = userMessage.toLowerCase();
      
      if (lowerMessage.includes('search') || lowerMessage.includes('find') || 
          lowerMessage.includes('show') || lowerMessage.includes('looking for')) {
        return {
          type: 'product_search',
          requiresTools: true,
          suggestedTools: ['search_products'],
          parameters: { query: userMessage },
        };
      }
      
      if (lowerMessage.includes('cart')) {
        return {
          type: 'view_cart',
          requiresTools: true,
          suggestedTools: ['get_cart'],
          parameters: {},
        };
      }

      return {
        type: 'general_question',
        requiresTools: false,
        suggestedTools: [],
        parameters: {},
      };
    }
  }

  /**
   * Execute tools based on intent
   */
  async executeTools(intent, context) {
    const results = [];

    for (const toolName of intent.suggestedTools) {
      try {
        const params = this.extractToolParameters(toolName, intent, context);
        
        const result = await this.toolAdapter.executeTool(
          toolName,
          params,
          context
        );

        results.push({
          toolName,
          success: result.success,
          data: result.data,
          error: result.error,
          message: result.message,
        });

      } catch (error) {
        console.error(`[AgentOrchestrator] Tool ${toolName} failed:`, error);
        results.push({
          toolName,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Extract parameters for tool execution
   */
  extractToolParameters(toolName, intent, context) {
    const params = { ...intent.parameters };

    // Add context parameters
    if (context.cartId) {
      params.cartId = context.cartId;
    }

    // Extract search query from user message if needed
    if (toolName === 'search_products' && !params.query) {
      params.query = intent.parameters.query || '';
    }

    return params;
  }

  /**
   * Generate response with tool results
   */
  async generateResponseWithTools(userMessage, toolResults, conversationHistory) {
    const toolContext = toolResults
      .map(r => {
        if (r.success) {
          return `Tool: ${r.toolName}\nResult: ${JSON.stringify(r.data, null, 2)}`;
        } else {
          return `Tool: ${r.toolName}\nError: ${r.error}`;
        }
      })
      .join('\n\n');

    const recentHistory = conversationHistory.slice(-6).map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...recentHistory,
      {
        role: 'user',
        content: `Based on the tool results, provide a helpful response.

User's question: "${userMessage}"

Tool Results:
${toolContext}

Guidelines:
- Be conversational and natural
- Summarize the key information
- Format product information clearly
- Suggest next steps if appropriate
- Don't just repeat the data, interpret it for the user`,
      },
    ];

    return await this.llmProvider.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 800,
    });
  }

  /**
   * Generate direct response without tools
   */
  async generateDirectResponse(userMessage, conversationHistory) {
    const recentHistory = conversationHistory.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...recentHistory,
      { role: 'user', content: userMessage },
    ];

    return await this.llmProvider.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 600,
    });
  }
}

module.exports = { AgentOrchestrator };