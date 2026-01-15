/**
 * AI Shopping Assistant Chat Widget
 * Compatible with both PaaS and SaaS Magento
 * Supports guest and logged-in users
 */

import React, { useState, useEffect, useRef } from 'react';
import './ChatWidget.css';

const ChatWidget = ({ actionUrl, magentoConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Initialize session
   * Detects guest vs logged-in user
   */
  const initializeSession = async () => {
    try {
      // Check for existing session in localStorage
      const existingSessionId = localStorage.getItem('ai_chat_session_id');
      
      // Check if user is logged in (from Magento)
      const customerToken = getCustomerToken();
      const cartId = getCartId();

      setSession({
        sessionId: existingSessionId,
        customerToken: customerToken || null,
        cartId: cartId || null,
        isGuest: !customerToken,
      });

      console.log('Session initialized:', {
        hasSession: !!existingSessionId,
        isGuest: !customerToken,
        hasCart: !!cartId,
      });

      // Add welcome message
      if (!existingSessionId) {
        addSystemMessage(
          customerToken
            ? "Hi! I'm your AI shopping assistant. How can I help you today?"
            : "Hi! I'm your AI shopping assistant. I can help you find products and manage your cart. What are you looking for?"
        );
      }

    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  };

  /**
   * Get customer token from Magento
   * Works with both PaaS and SaaS
   */
  const getCustomerToken = () => {
    // Try localStorage (common in PWA)
    const token = localStorage.getItem('customer_token') ||
                  localStorage.getItem('mage-cache-storage')?.customer?.token;
    
    // Try cookies
    if (!token) {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        if (cookie.trim().startsWith('customer_token=')) {
          return cookie.split('=')[1];
        }
      }
    }

    return token;
  };

  /**
   * Get cart ID from Magento
   */
  const getCartId = () => {
    // Try localStorage
    const cartId = localStorage.getItem('cart_id') ||
                   localStorage.getItem('mage-cache-storage')?.cart?.cartId;
    
    // Try Magento's customer data
    if (window.customerData && window.customerData.cart) {
      return window.customerData.cart().cartId;
    }

    return cartId;
  };

  /**
   * Send message to AI
   */
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to UI
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      const response = await fetch(actionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: session?.sessionId,
          customerToken: session?.customerToken,
          cartId: session?.cartId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update session if changed
        if (data.sessionId && data.sessionId !== session?.sessionId) {
          localStorage.setItem('ai_chat_session_id', data.sessionId);
          setSession(prev => ({ ...prev, sessionId: data.sessionId }));
        }

        // Update cart ID if changed
        if (data.cartId && data.cartId !== session?.cartId) {
          localStorage.setItem('cart_id', data.cartId);
          setSession(prev => ({ ...prev, cartId: data.cartId }));
        }

        // Add AI response
        addMessage('assistant', data.response, {
          toolsUsed: data.toolsUsed,
          intent: data.intent,
        });

      } else {
        addMessage('error', `Error: ${data.error || 'Something went wrong'}`);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage('error', 'Failed to connect to the assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add message to chat
   */
  const addMessage = (role, content, metadata = {}) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        role,
        content,
        timestamp: new Date(),
        ...metadata,
      },
    ]);
  };

  /**
   * Add system message
   */
  const addSystemMessage = (content) => {
    addMessage('system', content);
  };

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Handle key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Toggle widget open/close
   */
  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="ai-chat-widget">
      {/* Chat Button */}
      <button
        className={`chat-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={toggleWidget}
        aria-label="Toggle chat"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <h3>🤖 AI Shopping Assistant</h3>
            <span className="user-type">
              {session?.isGuest ? '👤 Guest' : '👤 Logged In'}
            </span>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message message-${msg.role}`}>
                <div className="message-content">
                  {msg.content}
                </div>
                {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                  <div className="message-meta">
                    🔧 Used: {msg.toolsUsed.join(', ')}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="message message-assistant">
                <div className="message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              rows="1"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="send-btn"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;