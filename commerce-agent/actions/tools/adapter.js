/**
 * Tool Adapter - Abstraction layer for tool implementations
 * Allows easy switching between built-in, Adobe MCP, or custom MCP
 */

const { BuiltInTools } = require('./built-in');

class ToolAdapter {
  constructor(config = {}) {
    this.mode = config.TOOL_MODE || process.env.TOOL_MODE || 'built-in';
    this.config = config;
    this.implementation = null;
    
    console.log(`[ToolAdapter] Initializing in ${this.mode} mode`);
  }

  async initialize() {
    try {
      switch (this.mode) {
        case 'built-in':
          this.implementation = new BuiltInTools(this.config);
          break;
        
        case 'adobe-mcp':
          // Future: When Adobe MCP is available
          const { AdobeMCPClient } = require('./adobe-mcp/client');
          this.implementation = new AdobeMCPClient(this.config);
          break;
        
        case 'custom-mcp':
          // For external MCP server deployment
          const { CustomMCPClient } = require('./custom-mcp/client');
          this.implementation = new CustomMCPClient(this.config);
          break;
        
        default:
          throw new Error(`Unknown tool mode: ${this.mode}`);
      }
      
      await this.implementation.initialize();
      console.log(`[ToolAdapter] ✅ Tools initialized successfully in ${this.mode} mode`);
    } catch (error) {
      console.error('[ToolAdapter] ❌ Initialization failed:', error);
      throw error;
    }
  }

  async getTools() {
    if (!this.implementation) {
      throw new Error('ToolAdapter not initialized. Call initialize() first.');
    }
    return this.implementation.getTools();
  }

  async executeTool(toolName, params, context = {}) {
    if (!this.implementation) {
      throw new Error('ToolAdapter not initialized. Call initialize() first.');
    }
    
    console.log(`[ToolAdapter] Executing tool: ${toolName}`);
    return this.implementation.executeTool(toolName, params, context);
  }
}

module.exports = { ToolAdapter };