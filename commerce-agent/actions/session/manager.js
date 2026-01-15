/**
 * Session Manager
 * Handles both guest and logged-in user sessions
 * Manages chat history and cart association
 */

const { v4: uuidv4 } = require('uuid');

class SessionManager {
  constructor(storage) {
    this.storage = storage; // Can be in-memory, Redis, or other storage
    this.sessions = new Map(); // In-memory cache
  }

  /**
   * Get or create session
   * Handles both guest and logged-in users
   */
  async getOrCreateSession(params) {
    const { sessionId, customerToken, cartId } = params;
    
    console.log('[SessionManager] Getting/creating session', {
      hasSessionId: !!sessionId,
      hasCustomerToken: !!customerToken,
      hasCartId: !!cartId,
    });

    // If session ID provided, try to load it
    if (sessionId) {
      const existingSession = await this.loadSession(sessionId);
      if (existingSession) {
        console.log('[SessionManager] ✅ Loaded existing session');
        
        // Update customer token if provided (user logged in during session)
        if (customerToken && !existingSession.customerToken) {
          existingSession.customerToken = customerToken;
          existingSession.userType = 'logged-in';
          await this.saveSession(existingSession);
          console.log('[SessionManager] ✅ Session upgraded to logged-in user');
        }
        
        return existingSession;
      }
    }

    // Create new session
    const newSession = await this.createSession({
      customerToken,
      cartId,
    });
    
    console.log('[SessionManager] ✅ Created new session:', newSession.sessionId);
    
    return newSession;
  }

  /**
   * Create new session
   */
  async createSession(params) {
    const { customerToken, cartId } = params;
    
    const session = {
      sessionId: uuidv4(),
      userType: customerToken ? 'logged-in' : 'guest',
      customerToken: customerToken || null,
      cartId: cartId || null,
      conversationHistory: [],
      metadata: {
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      },
    };

    await this.saveSession(session);
    
    return session;
  }

  /**
   * Load session from storage
   */
  async loadSession(sessionId) {
    // Check in-memory cache first
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId);
    }

    // Load from persistent storage (if available)
    if (this.storage) {
      try {
        const session = await this.storage.get(sessionId);
        if (session) {
          this.sessions.set(sessionId, session);
          return session;
        }
      } catch (error) {
        console.error('[SessionManager] Failed to load from storage:', error);
      }
    }

    return null;
  }

  /**
   * Save session to storage
   */
  async saveSession(session) {
    // Update last activity
    session.metadata.lastActivity = new Date().toISOString();
    
    // Save to in-memory cache
    this.sessions.set(session.sessionId, session);

    // Save to persistent storage (if available)
    if (this.storage) {
      try {
        await this.storage.set(session.sessionId, session);
      } catch (error) {
        console.error('[SessionManager] Failed to save to storage:', error);
      }
    }
  }

  /**
   * Add message to conversation history
   */
  async addMessage(sessionId, role, content, metadata = {}) {
    const session = await this.loadSession(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const message = {
      role,
      content,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    session.conversationHistory.push(message);
    
    // Limit history to last 50 messages
    if (session.conversationHistory.length > 50) {
      session.conversationHistory = session.conversationHistory.slice(-50);
    }

    await this.saveSession(session);
    
    return message;
  }

  /**
   * Get conversation history
   */
  async getHistory(sessionId, limit = 10) {
    const session = await this.loadSession(sessionId);
    
    if (!session) {
      return [];
    }

    return session.conversationHistory.slice(-limit);
  }

  /**
   * Update cart ID in session
   */
  async updateCartId(sessionId, cartId) {
    const session = await this.loadSession(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.cartId = cartId;
    await this.saveSession(session);
    
    console.log(`[SessionManager] ✅ Updated cart ID: ${cartId}`);
  }

  /**
   * Clear session history
   */
  async clearHistory(sessionId) {
    const session = await this.loadSession(sessionId);
    
    if (session) {
      session.conversationHistory = [];
      await this.saveSession(session);
      console.log('[SessionManager] ✅ History cleared');
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId) {
    // Remove from cache
    this.sessions.delete(sessionId);

    // Remove from storage
    if (this.storage) {
      try {
        await this.storage.delete(sessionId);
      } catch (error) {
        console.error('[SessionManager] Failed to delete from storage:', error);
      }
    }
    
    console.log(`[SessionManager] ✅ Deleted session: ${sessionId}`);
  }

  /**
   * Cleanup old sessions (for maintenance)
   */
  async cleanupOldSessions(maxAgeHours = 24) {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const lastActivity = new Date(session.metadata.lastActivity);
      
      if (lastActivity < cutoffTime) {
        await this.deleteSession(sessionId);
        cleanedCount++;
      }
    }

    console.log(`[SessionManager] ✅ Cleaned up ${cleanedCount} old sessions`);
  }
}

module.exports = { SessionManager };