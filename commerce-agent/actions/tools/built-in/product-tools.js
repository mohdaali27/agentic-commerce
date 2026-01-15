/**
 * Product Tools - Search and get product details
 */

const { PRODUCT_SEARCH_QUERY, GET_PRODUCT_DETAILS_QUERY } = require('./queries');

const productSearchTool = {
  name: 'search_products',
  description: 'Search for products in the Magento catalog. Returns product information including name, price, image, and stock status.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (product name, keywords, category)',
      },
      pageSize: {
        type: 'number',
        description: 'Number of products to return (default: 10, max: 20)',
      },
      currentPage: {
        type: 'number',
        description: 'Page number for pagination (default: 1)',
      },
    },
    required: ['query'],
  },
  
  async execute(magentoClient, params, context = {}) {
    try {
      const { query, pageSize = 10, currentPage = 1 } = params;
      
      console.log(`[ProductSearch] Searching for: "${query}"`);
      
      const data = await magentoClient.query(PRODUCT_SEARCH_QUERY, {
        search: query,
        pageSize: Math.min(pageSize, 20), // Limit to 20
        currentPage,
      });

      const products = data.products.items.map(item => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        price: item.price_range.minimum_price.final_price.value,
        regularPrice: item.price_range.minimum_price.regular_price.value,
        currency: item.price_range.minimum_price.final_price.currency,
        image: item.image?.url || item.small_image?.url,
        stockStatus: item.stock_status,
        urlKey: item.url_key,
      }));

      console.log(`[ProductSearch] ✅ Found ${products.length} products`);

      return {
        success: true,
        data: {
          products,
          totalCount: data.products.total_count,
          pageInfo: data.products.page_info,
        },
        message: `Found ${products.length} products matching "${query}"`,
      };

    } catch (error) {
      console.error('[ProductSearch] ❌ Failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

const getProductDetailsTool = {
  name: 'get_product_details',
  description: 'Get detailed information about a specific product by SKU',
  inputSchema: {
    type: 'object',
    properties: {
      sku: {
        type: 'string',
        description: 'Product SKU',
      },
    },
    required: ['sku'],
  },
  
  async execute(magentoClient, params, context = {}) {
    try {
      const { sku } = params;
      
      console.log(`[ProductDetails] Getting details for SKU: ${sku}`);
      
      const data = await magentoClient.query(GET_PRODUCT_DETAILS_QUERY, { sku });

      if (!data.products.items.length) {
        console.log(`[ProductDetails] ⚠️  Product not found: ${sku}`);
        return {
          success: false,
          error: `Product with SKU "${sku}" not found`,
        };
      }

      const product = data.products.items[0];
      
      console.log(`[ProductDetails] ✅ Found product: ${product.name}`);

      return {
        success: true,
        data: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description?.html,
          price: product.price_range.minimum_price.final_price.value,
          currency: product.price_range.minimum_price.final_price.currency,
          image: product.image?.url,
          mediaGallery: product.media_gallery,
          stockStatus: product.stock_status,
        },
      };

    } catch (error) {
      console.error('[ProductDetails] ❌ Failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

module.exports = {
  productSearchTool,
  getProductDetailsTool,
};