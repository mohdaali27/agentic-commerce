/**
 * Chat Widget Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatWidget from './components/ChatWidget';

// Export for UMD build (can be used in Magento)
export { ChatWidget };

// Auto-initialize if element exists
if (typeof window !== 'undefined') {
  window.initChatWidget = function(config) {
    const container = document.getElementById('ai-chat-widget-root') || 
                     document.createElement('div');
    
    if (!document.getElementById('ai-chat-widget-root')) {
      container.id = 'ai-chat-widget-root';
      document.body.appendChild(container);
    }

    const root = ReactDOM.createRoot(container);
    root.render(<ChatWidget {...config} />);
  };

  // Auto-initialize with default config
  document.addEventListener('DOMContentLoaded', () => {
    if (window.chatWidgetConfig) {
      window.initChatWidget(window.chatWidgetConfig);
    }
  });
}