Complete Testing Guide
🧪 Pre-Test Checklist
1. Verify Services Running
bash# Check Ollama
curl http://localhost:11434/api/tags

# Check Magento
curl -k https://magento.local/graphql

# Check Docker (if using Docker Magento)
docker ps | grep magento
2. Verify Configuration
bash# Check .env file exists and has required values
cat .env | grep -E "MAGENTO_GRAPHQL_URL|LLM_PROVIDER|OLLAMA_BASE_URL"

🚀 Local Testing
Step 1: Start App Builder Locally
bashcd ~/agentic-commerce/commerce-agent

# Start in local mode (can access localhost services)
aio app run

# Wait for:
# "To view your local application: -> https://localhost:9080"
Step 2: Test Health Check
bash# In another terminal
curl http://localhost:9080/api/v1/web/guest/commerce-agent/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
Expected response:
json{
  "success": true,
  "response": "Hello! I'm your AI shopping assistant...",
  "sessionId": "uuid-here",
  "userType": "guest",
  "toolsUsed": [],
  "intent": "greeting"
}
Step 3: Test Product Search
bashcurl http://localhost:9080/api/v1/web/guest/commerce-agent/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me red shirts under $50"
  }'
Expected response:
json{
  "success": true,
  "response": "I found several red shirts...",
  "sessionId": "uuid",
  "toolsUsed": ["search_products"],
  "intent": "product_search"
}
Step 4: Test Cart Operations
bash# Create cart and add item
curl http://localhost:9080/api/v1/web/guest/commerce-agent/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Add the first shirt to my cart",
    "sessionId": "your-session-id-from-previous-response"
  }'
Step 5: Test Session Persistence
bash# Use the same sessionId across multiple requests
SESSION_ID="your-session-id"

# Request 1
curl http://localhost:9080/api/v1/web/guest/commerce-agent/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Show me shirts\", \"sessionId\": \"$SESSION_ID\"}"

# Request 2 (should remember context)
curl http://localhost:9080/api/v1/web/guest/commerce-agent/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Show me the first one\", \"sessionId\": \"$SESSION_ID\"}"

🧑‍💻 Testing with Different User Types
Guest User Test
bashcurl http://localhost:9080/api/v1/web/guest/commerce-agent/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Search for blue jeans"
  }'

# Response will have: "userType": "guest"
Logged-in User Test
bash# Get a customer token from Magento first
CUSTOMER_TOKEN="your-magento-customer-token"

curl http://localhost:9080/api/v1/web/guest/commerce-agent/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Show my cart\",
    \"customerToken\": \"$CUSTOMER_TOKEN\"
  }"

# Response will have: "userType": "logged-in"

🎨 Testing Chat Widget UI
Step 1: Build Widget
bashcd web-src
npm install
npm run build
Step 2: Test in Browser
Open http://localhost:9080 in your browser.
Manual Test Checklist:

 Widget button appears in bottom-right corner
 Clicking opens chat window
 Can send messages
 Receives AI responses
 Loading indicator shows while waiting
 Session persists across page reloads
 Works in both mobile and desktop views


🔄 Testing LLM Provider Switching
Test with Ollama (Local)
bash# .env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Restart
aio app run
Test with OpenAI
bash# .env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini

# Restart
aio app run
Test with Claude
bash# .env
LLM_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-your-key
CLAUDE_MODEL=claude-sonnet-4-20250514

# Restart
aio app run

🐛 Troubleshooting
Issue: "Cannot connect to Ollama"
bash# Check Ollama is running
ollama serve

# Verify accessibility
curl http://localhost:11434/api/tags
Issue: "Magento GraphQL failed"
bash# Test Magento directly
curl -k -X POST https://magento.local/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { name } } }"}'

# Check logs
docker logs magento-container
Issue: "Session not found"

Sessions are in-memory during local testing
Restarting the app clears all sessions
For production, implement Redis storage

Issue: "Tool execution failed"
bash# Check logs in terminal running aio app run
# Look for [ToolAdapter] or [MagentoClient] errors

# Enable debug logging in .env
LOG_LEVEL=debug

✅ Production Deployment Testing
Step 1: Deploy
bashaio app deploy
Step 2: Get Production URL
bashaio app info

# Look for:
# Action URL: https://namespace.adobeioruntime.net/api/v1/web/commerce-agent/chat
Step 3: Test Production Endpoint
bashPROD_URL="https://namespace.adobeioruntime.net/api/v1/web/commerce-agent/chat"

curl -X POST "$PROD_URL" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
Step 4: Monitor Logs
bash# View real-time logs
aio app logs

# View specific action logs
aio runtime activation logs --last

📊 Performance Testing
Response Time Test
bash# Test 10 requests
for i in {1..10}; do
  time curl -X POST http://localhost:9080/api/v1/web/guest/commerce-agent/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "hello"}' \
    > /dev/null 2>&1
done
Concurrent Users Test
bash# Test 5 concurrent requests
for i in {1..5}; do
  curl -X POST http://localhost:9080/api/v1/web/guest/commerce-agent/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "search for shoes"}' &
done
wait

🎯 Test Coverage Checklist
Functionality Tests

 Product search works
 Product details retrieval works
 Cart creation works
 Add to cart works
 View cart works
 Update cart item works
 Remove cart item works

User Type Tests

 Guest user flow works
 Logged-in user flow works
 Session upgrade (guest → logged-in) works

LLM Provider Tests

 Ollama provider works
 OpenAI provider works
 Claude provider works

Session Tests

 Session creation works
 Session persistence works
 Conversation history maintained
 Session recovery works

Integration Tests

 Magento PaaS integration works
 Future SaaS compatibility ready
 Tool adapter switching works
 Error handling works properly


📝 Test Results Template
markdown## Test Results - [Date]

### Environment
- Magento: [Local/Cloud]
- LLM Provider: [Ollama/OpenAI/Claude]
- Tool Mode: [built-in]

### Test Results
| Test | Status | Notes |
|------|--------|-------|
| Product Search | ✅ PASS | - |
| Add to Cart | ✅ PASS | - |
| Guest User Flow | ✅ PASS | - |
| Logged-in Flow | ✅ PASS | - |
| Session Persistence | ✅ PASS | - |

### Issues Found
1. [Issue description]
2. [Issue description]

### Performance
- Average response time: X ms
- Concurrent users tested: Y

🚀 Ready for Production?
Before going live, ensure:

 All tests pass
 LLM provider configured (OpenAI/Claude for production)
 Magento Commerce Cloud connected
 Error handling tested
 Performance acceptable
 Logs monitored
 Backup plan ready
