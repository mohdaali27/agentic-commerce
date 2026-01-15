#!/bin/bash

# ============================================
# Complete Setup Script for Agentic Commerce
# ============================================

set -e

echo "🚀 Setting up Agentic Commerce - Hybrid Architecture"
echo "===================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the commerce-agent directory"
    exit 1
fi

# Step 1: Create directory structure
echo "📁 Step 1: Creating directory structure..."
mkdir -p actions/{chat,tools/{built-in,adobe-mcp},agent,utils,session}
mkdir -p web-src/src/{components,hooks,services,utils}
echo "✅ Directories created"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
npm install axios dotenv uuid
echo "✅ Dependencies installed"
echo ""

# Step 3: Check for required files
echo "📝 Step 3: Checking for required files..."

required_files=(
    "actions/tools/adapter.js"
    "actions/tools/built-in/magento-client.js"
    "actions/tools/built-in/queries.js"
    "actions/tools/built-in/product-tools.js"
    "actions/tools/built-in/cart-tools.js"
    "actions/tools/built-in/index.js"
    "actions/utils/llm-provider.js"
    "actions/session/manager.js"
    "actions/agent/orchestrator.js"
    "actions/chat/index.js"
    "web-src/src/components/ChatWidget.jsx"
    "web-src/src/components/ChatWidget.css"
    "app.config.yaml"
    ".env"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    echo "✅ All required files present"
else
    echo "⚠️  Missing files:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "Please create the missing files using the artifacts provided."
fi
echo ""

# Step 4: Verify environment configuration
echo "⚙️  Step 4: Verifying environment configuration..."

if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    echo "Creating template .env file..."
    cat > .env << 'EOF'
# Adobe I/O Runtime
AIO_runtime_namespace=your_namespace
AIO_runtime_auth=your_auth_token

# Tool Configuration
TOOL_MODE=built-in

# Magento Configuration
MAGENTO_GRAPHQL_URL=https://magento.local/graphql
MAGENTO_API_TOKEN=

# LLM Provider
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Development
NODE_ENV=development
LOG_LEVEL=debug
EOF
    echo "✅ Template .env created - Please update with your values"
else
    echo "✅ .env file exists"
    
    # Check for required environment variables
    required_vars=("MAGENTO_GRAPHQL_URL" "LLM_PROVIDER")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            echo "⚠️  Missing: $var"
        fi
    done
fi
echo ""

# Step 5: Summary and next steps
echo "===================================================="
echo "✅ Setup Complete!"
echo "===================================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update .env file with your configuration:"
echo "   - MAGENTO_GRAPHQL_URL"
echo "   - LLM provider settings (Ollama/OpenAI/Claude)"
echo ""
echo "2. Ensure required services are running:"
echo "   ✓ Magento (Docker or Cloud)"
echo "   ✓ Ollama (if using local LLM)"
echo ""
echo "3. Test locally:"
echo "   aio app run"
echo ""
echo "4. Test the chat endpoint:"
echo "   curl -X POST http://localhost:9080/api/v1/web/guest/commerce-agent/chat \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"message\": \"Hello\"}'"
echo ""
echo "5. Deploy to production:"
echo "   aio app deploy"
echo ""
echo "===================================================="
echo "📚 Documentation:"
echo "   - Local testing: Use 'aio app run'"
echo "   - Deployment: Use 'aio app deploy'"
echo "   - Logs: Use 'aio app logs'"
echo "===================================================="