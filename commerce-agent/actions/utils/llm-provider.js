/**
 * LLM Provider - Unified interface for Ollama, OpenAI, and Claude
 */

const axios = require('axios');

class LLMProvider {
  constructor(config) {
    this.provider = config.provider || 'ollama';
    this.config = config;
    
    console.log(`[LLMProvider] Using provider: ${this.provider}`);
    
    // Validate configuration
    this.validateConfig();
  }

  validateConfig() {
    switch (this.provider) {
      case 'ollama':
        if (!this.config.ollamaBaseUrl) {
          throw new Error('OLLAMA_BASE_URL is required for Ollama provider');
        }
        break;
      case 'openai':
        if (!this.config.openaiApiKey) {
          throw new Error('OPENAI_API_KEY is required for OpenAI provider');
        }
        break;
      case 'claude':
        if (!this.config.claudeApiKey) {
          throw new Error('CLAUDE_API_KEY is required for Claude provider');
        }
        break;
      case 'gemini':
        if (!this.config.geminiApiKey) {
          throw new Error('GOOGLE_API_KEY is required for Gemini provider');
        }
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  async generateCompletion(messages, options = {}) {
    console.log(`[LLMProvider] Generating completion with ${this.provider}`);
    
    switch (this.provider) {
      case 'ollama':
        return this.generateOllama(messages, options);
      case 'openai':
        return this.generateOpenAI(messages, options);
      case 'claude':
        return this.generateClaude(messages, options);
      case 'gemini':
        return this.generateGemini(messages, options);
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  async generateOllama(messages, options = {}) {
    const url = `${this.config.ollamaBaseUrl}/api/chat`;
    
    const payload = {
      model: this.config.ollamaModel || 'llama3.2',
      messages: messages,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        num_predict: options.maxTokens || 1000,
      },
    };

    try {
      console.log('[LLMProvider] Calling Ollama at:', url);
      console.log('[LLMProvider] Model:', payload.model);
      
      const response = await axios.post(url, payload, {
        timeout: 120000, // 2 minutes for local models
      });

      console.log('[LLMProvider] ✅ Ollama response received');

      return {
        content: response.data.message.content,
        usage: {
          promptTokens: response.data.prompt_eval_count || 0,
          completionTokens: response.data.eval_count || 0,
          totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0),
        },
        model: response.data.model,
      };
    } catch (error) {
      console.error('[LLMProvider] ❌ Ollama error details:', {
        message: error.message,
        url: url,
        model: payload.model,
        code: error.code,
        response: error.response?.data,
      });
      
      // Provide helpful error messages
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Ollama at ${url}. Is Ollama running? Start with: ollama serve`);
      }
      
      if (error.response?.status === 404) {
        throw new Error(`Model "${payload.model}" not found. Pull it with: ollama pull ${payload.model}`);
      }
      
      throw new Error(`Ollama API failed: ${error.message}`);
    }
  }

  async generateOpenAI(messages, options = {}) {
    const url = 'https://api.openai.com/v1/chat/completions';
    
    const payload = {
      model: this.config.openaiModel || 'gpt-4o-mini',
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.openaiApiKey}`,
        },
        timeout: 60000,
      });

      console.log('[LLMProvider] ✅ OpenAI response received');

      const choice = response.data.choices[0];

      return {
        content: choice.message.content,
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
        model: response.data.model,
      };
    } catch (error) {
      console.error('[LLMProvider] ❌ OpenAI error:', error.response?.data || error.message);
      throw new Error(`OpenAI API failed: ${error.message}`);
    }
  }

  async generateClaude(messages, options = {}) {
    const url = 'https://api.anthropic.com/v1/messages';
    
    // Claude uses system message separately
    let systemMessage = '';
    const claudeMessages = [];
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        systemMessage = msg.content;
      } else {
        claudeMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    const payload = {
      model: this.config.claudeModel || 'claude-sonnet-4-20250514',
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      messages: claudeMessages,
    };

    if (systemMessage) {
      payload.system = systemMessage;
    }

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        timeout: 60000,
      });

      console.log('[LLMProvider] ✅ Claude response received');

      return {
        content: response.data.content[0].text,
        usage: {
          promptTokens: response.data.usage.input_tokens,
          completionTokens: response.data.usage.output_tokens,
          totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens,
        },
        model: response.data.model,
      };
    } catch (error) {
      console.error('[LLMProvider] ❌ Claude error:', error.response?.data || error.message);
      throw new Error(`Claude API failed: ${error.message}`);
    }
  }

  /**
   * Google Gemini implementation
   */
  async generateGemini(messages, options = {}) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
    
    // Convert messages to Gemini format
    const geminiContents = [];
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        // Gemini doesn't have system role, prepend to first user message
        if (geminiContents.length === 0) {
          geminiContents.push({
            role: 'user',
            parts: [{ text: `${msg.content}\n\n` }]
          });
        }
      } else {
        geminiContents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    const payload = {
      contents: geminiContents,
      generationConfig: {
        temperature: options.temperature || 0,
        maxOutputTokens: options.maxTokens || 2048,
      },
    };

    try {
      console.log('[LLMProvider] Calling Gemini API');
      
      const response = await axios.post(
        `${url}?key=${this.config.geminiApiKey}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      console.log('[LLMProvider] ✅ Gemini response received');

      // Extract response text
      const candidate = response.data.candidates[0];
      const content = candidate.content.parts[0].text;

      // Extract usage metadata
      const usageMetadata = response.data.usageMetadata || {};

      return {
        content: content,
        usage: {
          promptTokens: usageMetadata.promptTokenCount || 0,
          completionTokens: usageMetadata.candidatesTokenCount || 0,
          totalTokens: usageMetadata.totalTokenCount || 0,
        },
        model: 'gemini-2.5-flash-lite',
      };
    } catch (error) {
      console.error('[LLMProvider] ❌ Gemini error:', error.response?.data || error.message);
      
      if (error.response?.status === 400) {
        throw new Error(`Gemini API error: ${error.response.data.error.message || 'Bad request'}`);
      }
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Gemini API key. Check GOOGLE_API_KEY in .env');
      }
      
      throw new Error(`Gemini API failed: ${error.message}`);
    }
  }
}

function createLLMProvider(params = {}) {
  const config = {
    provider: params.LLM_PROVIDER || process.env.LLM_PROVIDER || 'ollama',
    
    // Ollama config
    ollamaBaseUrl: params.OLLAMA_BASE_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    ollamaModel: params.OLLAMA_MODEL || process.env.OLLAMA_MODEL || 'llama3.2',
    
    // OpenAI config
    openaiApiKey: params.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    openaiModel: params.OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    
    // Claude config
    claudeApiKey: params.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY,
    claudeModel: params.CLAUDE_MODEL || process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    
    // Gemini config
    geminiApiKey: params.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY,
    geminiModel: params.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',

  };

  return new LLMProvider(config);
}

module.exports = { LLMProvider, createLLMProvider };