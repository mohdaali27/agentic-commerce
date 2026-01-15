/**
 * Cart Tools - Create, add, update, remove cart items
 */

const {
  CREATE_EMPTY_CART_MUTATION,
  ADD_PRODUCTS_TO_CART_MUTATION,
  GET_CART_QUERY,
  UPDATE_CART_ITEMS_MUTATION,
  REMOVE_ITEM_FROM_CART_MUTATION,
  GET_CUSTOMER_CART_QUERY,
} = require('./queries');

const createCartTool = {
  name: 'create_cart',
  description: 'Create a new empty shopping cart',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  
  async execute(magentoClient, params, context = {}) {
    try {
      console.log('[CreateCart] Creating new cart');
      
      const data = await magentoClient.mutate(
        CREATE_EMPTY_CART_MUTATION,
        {},
        context.customerToken
      );

      const cartId = data.createEmptyCart;
      
      console.log(`[CreateCart] ✅ Cart created: ${cartId}`);

      return {
        success: true,
        data: { cartId },
        message: 'Shopping cart created successfully',
      };

    } catch (error) {
      console.error('[CreateCart] ❌ Failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

const addToCartTool = {
  name: 'add_to_cart',
  description: 'Add a product to the shopping cart',
  inputSchema: {
    type: 'object',
    properties: {
      sku: {
        type: 'string',
        description: 'Product SKU to add',
      },
      quantity: {
        type: 'number',
        description: 'Quantity to add (default: 1)',
      },
      cartId: {
        type: 'string',
        description: 'Cart ID (required)',
      },
    },
    required: ['sku', 'cartId'],
  },
  
  async execute(magentoClient, params, context = {}) {
    try {
      const { sku, quantity = 1, cartId } = params;
      
      console.log(`[AddToCart] Adding ${quantity}x ${sku} to cart ${cartId}`);

      const data = await magentoClient.mutate(
        ADD_PRODUCTS_TO_CART_MUTATION,
        {
          cartId,
          cartItems: [{ sku, quantity }],
        },
        context.customerToken
      );

      // Check for user errors
      if (data.addProductsToCart.user_errors?.length > 0) {
        const errors = data.addProductsToCart.user_errors
          .map(e => e.message)
          .join(', ');
        
        console.error('[AddToCart] ❌ User errors:', errors);
        
        return {
          success: false,
          error: errors,
        };
      }

      const cart = data.addProductsToCart.cart;
      
      console.log(`[AddToCart] ✅ Added to cart. Total items: ${cart.total_quantity}`);

      return {
        success: true,
        data: {
          cartId: cart.id,
          totalItems: cart.total_quantity,
          total: cart.prices.grand_total.value,
          currency: cart.prices.grand_total.currency,
          items: cart.items,
        },
        message: `Added ${quantity} ${quantity === 1 ? 'item' : 'items'} to cart`,
      };

    } catch (error) {
      console.error('[AddToCart] ❌ Failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

const getCartTool = {
  name: 'get_cart',
  description: 'Get shopping cart contents and totals',
  inputSchema: {
    type: 'object',
    properties: {
      cartId: {
        type: 'string',
        description: 'Cart ID',
      },
    },
    required: ['cartId'],
  },
  
  async execute(magentoClient, params, context = {}) {
    try {
      const { cartId } = params;
      
      console.log(`[GetCart] Retrieving cart ${cartId}`);

      const data = await magentoClient.query(
        GET_CART_QUERY,
        { cartId },
        context.customerToken
      );

      const cart = data.cart;
      
      console.log(`[GetCart] ✅ Cart has ${cart.total_quantity} items`);

      return {
        success: true,
        data: {
          cartId: cart.id,
          items: cart.items,
          totalItems: cart.total_quantity,
          total: cart.prices.grand_total.value,
          currency: cart.prices.grand_total.currency,
          subtotal: cart.prices.subtotal_excluding_tax.value,
        },
      };

    } catch (error) {
      console.error('[GetCart] ❌ Failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

const updateCartItemTool = {
  name: 'update_cart_item',
  description: 'Update the quantity of an item in the cart',
  inputSchema: {
    type: 'object',
    properties: {
      cartId: {
        type: 'string',
        description: 'Cart ID',
      },
      cartItemId: {
        type: 'string',
        description: 'Cart item ID to update',
      },
      quantity: {
        type: 'number',
        description: 'New quantity',
      },
    },
    required: ['cartId', 'cartItemId', 'quantity'],
  },
  
  async execute(magentoClient, params, context = {}) {
    try {
      const { cartId, cartItemId, quantity } = params;
      
      console.log(`[UpdateCartItem] Updating item ${cartItemId} to quantity ${quantity}`);

      const data = await magentoClient.mutate(
        UPDATE_CART_ITEMS_MUTATION,
        { cartId, cartItemId, quantity },
        context.customerToken
      );

      console.log('[UpdateCartItem] ✅ Item updated');

      return {
        success: true,
        data: data.updateCartItems.cart,
        message: 'Cart item updated successfully',
      };

    } catch (error) {
      console.error('[UpdateCartItem] ❌ Failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

const removeCartItemTool = {
  name: 'remove_cart_item',
  description: 'Remove an item from the shopping cart',
  inputSchema: {
    type: 'object',
    properties: {
      cartId: {
        type: 'string',
        description: 'Cart ID',
      },
      cartItemId: {
        type: 'string',
        description: 'Cart item ID to remove',
      },
    },
    required: ['cartId', 'cartItemId'],
  },
  
  async execute(magentoClient, params, context = {}) {
    try {
      const { cartId, cartItemId } = params;
      
      console.log(`[RemoveCartItem] Removing item ${cartItemId} from cart`);

      const data = await magentoClient.mutate(
        REMOVE_ITEM_FROM_CART_MUTATION,
        { cartId, cartItemId },
        context.customerToken
      );

      console.log('[RemoveCartItem] ✅ Item removed');

      return {
        success: true,
        data: data.removeItemFromCart.cart,
        message: 'Item removed from cart',
      };

    } catch (error) {
      console.error('[RemoveCartItem] ❌ Failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

module.exports = {
  createCartTool,
  addToCartTool,
  getCartTool,
  updateCartItemTool,
  removeCartItemTool,
};