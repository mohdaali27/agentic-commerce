/**
 * Magento GraphQL Client
 * Compatible with both PaaS (Magento Commerce Cloud) and future SaaS
 */

const axios = require('axios');

class MagentoClient {
  constructor(config) {
    this.graphqlUrl = config.MAGENTO_GRAPHQL_URL || process.env.MAGENTO_GRAPHQL_URL;
    this.apiToken = config.MAGENTO_API_TOKEN || process.env.MAGENTO_API_TOKEN;
    this.mode = this.detectMode();
    
    if (!this.graphqlUrl) {
      throw new Error('MAGENTO_GRAPHQL_URL is required');
    }
    
    console.log(`[MagentoClient] Initialized in ${this.mode} mode`);
    console.log(`[MagentoClient] URL: ${this.graphqlUrl}`);
  }

  detectMode() {
    const url = this.graphqlUrl.toLowerCase();
    
    if (url.includes('magentosite.cloud') || url.includes('magento.cloud')) {
      return 'paas';
    } else if (url.includes('commerce.adobe.com')) {
      return 'saas'; // Future Adobe Commerce SaaS
    }
    
    return 'paas'; // Default to PaaS
  }

  async query(queryString, variables = {}, customerToken = null) {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add authentication based on mode and tokens
    if (this.mode === 'paas') {
      if (customerToken) {
        // Customer token takes precedence
        headers['Authorization'] = `Bearer ${customerToken}`;
      } else if (this.apiToken) {
        // Fall back to API token
        headers['Authorization'] = `Bearer ${this.apiToken}`;
      }
    } else if (this.mode === 'saas') {
      // Future SaaS authentication
      headers['X-Adobe-Commerce-API-Key'] = this.apiToken;
      if (customerToken) {
        headers['X-Customer-Token'] = customerToken;
      }
    }

    try {
      console.log(`[MagentoClient] Executing query`, {
        hasVariables: Object.keys(variables).length > 0,
        hasCustomerToken: !!customerToken,
      });

      const response = await axios.post(
        this.graphqlUrl,
        {
          query: queryString,
          variables,
        },
        { 
          headers,
          timeout: 30000,
          // For local HTTPS with self-signed certs
          httpsAgent: this.graphqlUrl.startsWith('https') ? 
            new (require('https').Agent)({ rejectUnauthorized: false }) : 
            undefined,
        }
      );

      // Check for GraphQL errors
      if (response.data.errors) {
        const errorMessages = response.data.errors.map(e => e.message).join(', ');
        console.error('[MagentoClient] GraphQL errors:', response.data.errors);
        throw new Error(`GraphQL Error: ${errorMessages}`);
      }

      console.log('[MagentoClient] ✅ Query successful');
      return response.data.data;

    } catch (error) {
      console.error('[MagentoClient] ❌ Query failed:', {
        message: error.message,
        url: this.graphqlUrl,
        status: error.response?.status,
      });

      // Provide helpful error messages
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Magento at ${this.graphqlUrl}. Is it running?`);
      }
      
      if (error.code === 'ENOTFOUND') {
        throw new Error(`Cannot resolve hostname. Check MAGENTO_GRAPHQL_URL: ${this.graphqlUrl}`);
      }

      throw new Error(`Magento API Error: ${error.message}`);
    }
  }

  async mutate(mutationString, variables = {}, customerToken = null) {
    return this.query(mutationString, variables, customerToken);
  }
}

module.exports = { MagentoClient };