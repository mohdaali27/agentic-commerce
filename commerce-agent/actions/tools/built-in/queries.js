/**
 * GraphQL Queries and Mutations for Magento
 */

// Product Queries
const PRODUCT_SEARCH_QUERY = `
  query ProductSearch($search: String!, $pageSize: Int, $currentPage: Int) {
    products(search: $search, pageSize: $pageSize, currentPage: $currentPage) {
      items {
        id
        sku
        name
        price_range {
          minimum_price {
            final_price {
              value
              currency
            }
            regular_price {
              value
              currency
            }
          }
        }
        image {
          url
          label
        }
        small_image {
          url
          label
        }
        stock_status
        url_key
      }
      total_count
      page_info {
        page_size
        current_page
        total_pages
      }
    }
  }
`;

const GET_PRODUCT_DETAILS_QUERY = `
  query GetProductDetails($sku: String!) {
    products(filter: { sku: { eq: $sku } }) {
      items {
        id
        sku
        name
        description {
          html
        }
        price_range {
          minimum_price {
            final_price {
              value
              currency
            }
          }
        }
        image {
          url
        }
        media_gallery {
          url
          label
        }
        stock_status
      }
    }
  }
`;

// Cart Mutations
const CREATE_EMPTY_CART_MUTATION = `
  mutation CreateEmptyCart {
    createEmptyCart
  }
`;

const ADD_PRODUCTS_TO_CART_MUTATION = `
  mutation AddProductsToCart($cartId: String!, $cartItems: [CartItemInput!]!) {
    addProductsToCart(cartId: $cartId, cartItems: $cartItems) {
      cart {
        id
        items {
          id
          product {
            sku
            name
            thumbnail {
              url
              label
            }
          }
          quantity
          prices {
            row_total {
              value
              currency
            }
            price {
              value
              currency
            }
          }
        }
        prices {
          grand_total {
            value
            currency
          }
          subtotal_excluding_tax {
            value
            currency
          }
        }
        total_quantity
      }
      user_errors {
        code
        message
      }
    }
  }
`;

const GET_CART_QUERY = `
  query GetCart($cartId: String!) {
    cart(cart_id: $cartId) {
      id
      items {
        id
        product {
          sku
          name
          thumbnail {
            url
            label
          }
        }
        quantity
        prices {
          row_total {
            value
            currency
          }
          price {
            value
            currency
          }
        }
      }
      prices {
        grand_total {
          value
          currency
        }
        subtotal_excluding_tax {
          value
          currency
        }
      }
      total_quantity
    }
  }
`;

const UPDATE_CART_ITEMS_MUTATION = `
  mutation UpdateCartItems($cartId: String!, $cartItemId: ID!, $quantity: Float!) {
    updateCartItems(
      input: {
        cart_id: $cartId
        cart_items: [{ cart_item_id: $cartItemId, quantity: $quantity }]
      }
    ) {
      cart {
        id
        items {
          id
          quantity
        }
        total_quantity
      }
    }
  }
`;

const REMOVE_ITEM_FROM_CART_MUTATION = `
  mutation RemoveItemFromCart($cartId: String!, $cartItemId: ID!) {
    removeItemFromCart(input: { cart_id: $cartId, cart_item_id: $cartItemId }) {
      cart {
        id
        items {
          id
        }
        total_quantity
      }
    }
  }
`;

// Customer Queries
const GET_CUSTOMER_CART_QUERY = `
  query GetCustomerCart {
    customerCart {
      id
    }
  }
`;

module.exports = {
  PRODUCT_SEARCH_QUERY,
  GET_PRODUCT_DETAILS_QUERY,
  CREATE_EMPTY_CART_MUTATION,
  ADD_PRODUCTS_TO_CART_MUTATION,
  GET_CART_QUERY,
  UPDATE_CART_ITEMS_MUTATION,
  REMOVE_ITEM_FROM_CART_MUTATION,
  GET_CUSTOMER_CART_QUERY,
};