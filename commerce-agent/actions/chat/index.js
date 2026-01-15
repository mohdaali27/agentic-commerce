/**
 * Chat Action - Main endpoint for AI shopping assistant
 * Handles both guest and logged-in users
 */

const { AgentOrchestrator } = require('../agent/orchestrator');
const { SessionManager } = require('../session/manager');

// In-memory storage for development
// For production, replace with Redis or other persistent storage
const sessionManager = new SessionManager(null);

async function main(params) {
  console.log('[ChatAction] Request received');

  try {
    // Extract parameters
    const message = params.message;
    const sessionId = params.sessionId;
    const customerToken = params.customerToken;
    const cartId = params.cartId;

    // Validate required parameters
    if (!message) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: 'Parameter "message" is required',
        },
      };
    }

    console.log('[ChatAction] Processing message:', {
      message: message.substring(0, 50) + '...',
      hasSessionId: !!sessionId,
      hasCustomerToken: !!customerToken,
      hasCartId: !!cartId,
    });

    // Get or create session
    const session = await sessionManager.getOrCreateSession({
      sessionId,
      customerToken,
      cartId,
    });

    console.log('[ChatAction] Session:', {
      sessionId: session.sessionId,
      userType: session.userType,
      hasCart: !!session.cartId,
    });

    // Get conversation history
    const conversationHistory = await sessionManager.getHistory(session.sessionId);

    // Initialize agent
    const agent = new AgentOrchestrator({
      // Tool configuration
      TOOL_MODE: params.TOOL_MODE || process.env.TOOL_MODE,
      
      // Magento configuration
      MAGENTO_GRAPHQL_URL: params.MAGENTO_GRAPHQL_URL || process.env.MAGENTO_GRAPHQL_URL,
      MAGENTO_API_TOKEN: params.MAGENTO_API_TOKEN || process.env.MAGENTO_API_TOKEN,
      
      // LLM configuration
      LLM_PROVIDER: params.LLM_PROVIDER || process.env.LLM_PROVIDER,
      OLLAMA_BASE_URL: params.OLLAMA_BASE_URL || process.env.OLLAMA_BASE_URL,
      OLLAMA_MODEL: params.OLLAMA_MODEL || process.env.OLLAMA_MODEL,
      OPENAI_API_KEY: params.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      OPENAI_MODEL: params.OPENAI_MODEL || process.env.OPENAI_MODEL,
      CLAUDE_API_KEY: params.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY,
      CLAUDE_MODEL: params.CLAUDE_MODEL || process.env.CLAUDE_MODEL,
    });

    await agent.initialize();

    // Process message
    const result = await agent.processMessage(
      message,
      conversationHistory,
      {
        customerToken: session.customerToken,
        cartId: session.cartId,
      }
    );

    // Save messages to history
    await sessionManager.addMessage(session.sessionId, 'user', message);
    await sessionManager.addMessage(session.sessionId, 'assistant', result.response, {
      toolsUsed: result.toolsUsed,
      intent: result.intent,
    });

    // Check if cart was created during this interaction
    if (result.toolsUsed.includes('create_cart') && !session.cartId) {
      // Extract cart ID from tool results if available
      // This would need to be passed back from the agent
      // For now, the frontend will handle cart ID management
    }

    console.log('[ChatAction] ✅ Success');

    return {
      statusCode: 200,
      body: {
        success: true,
        response: result.response,
        sessionId: session.sessionId,
        userType: session.userType,
        toolsUsed: result.toolsUsed,
        intent: result.intent,
        cartId: session.cartId,
      },
    };

  } catch (error) {
    console.error('[ChatAction] ❌ Error:', error);
    
    return {
      statusCode: 500,
      body: {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  }
}

exports.main = main;