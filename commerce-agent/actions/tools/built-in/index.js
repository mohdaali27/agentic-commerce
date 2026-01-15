/**
 * Built-in Tools Implementation
 * All Magento tools implemented directly in App Builder
 */

const { MagentoClient } = require('./magento-client');
const { productSearchTool, getProductDetailsTool } = require('./product-tools');
const {
  createCartTool,
  addToCartTool,
  getCartTool,
  updateCartItemTool,
  removeCartItemTool,
} = require('./cart-tools');

class BuiltInTools {
  constructor(config = {}) {
    this.config = config;
    this.magentoClient = null;
    this.tools = [
      productSearchTool,
      getProductDetailsTool,
      createCartTool,
      addToCartTool,
      getCartTool,
      updateCartItemTool,
      removeCartItemTool,
    ];
    
    console.log('[BuiltInTools] Instance created');
  }

  async initialize() {
    console.log('[BuiltInTools] Initializing...');
    
    this.magentoClient = new MagentoClient(this.config);
    
    console.log(`[BuiltInTools] ✅ Initialized with ${this.tools.length} tools`);
  }

  async getTools() {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  async executeTool(toolName, params, context = {}) {
    const tool = this.tools.find(t => t.name === toolName);
    
    if (!tool) {
      console.error(`[BuiltInTools] ❌ Unknown tool: ${toolName}`);
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
      };
    }

    try {
      return await tool.execute(this.magentoClient, params, context);
    } catch (error) {
      console.error(`[BuiltInTools] ❌ Tool execution error:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = { BuiltInTools };