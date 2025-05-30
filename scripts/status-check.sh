#!/usr/bin/env zsh

# MCP Server Status Check

echo "🏠 Homey MCP Server - Status Check"
echo "=================================="
echo ""

cd "$(dirname "$0")/."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_status() {
    local method="$1"
    local description="$2"
    local request='{"jsonrpc": "2.0", "id": 1, "method": "'$method'", "params": {}}'
    
    echo -n "Checking $description... "
    
    local response=$(echo "$request" | node src/server.js 2>/dev/null)
    
    if echo "$response" | grep -q '"result"'; then
        echo "${GREEN}✅ OK${NC}"
        return 0
    elif echo "$response" | grep -q '"error"'; then
        echo "${RED}❌ ERROR${NC}"
        echo "   Error: $(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
        return 1
    else
        echo "${YELLOW}⚠️  UNKNOWN${NC}"
        return 1
    fi
}

echo "Testing MCP Server endpoints:"
echo ""

# Test basic MCP methods
check_status "tools/list" "Tools endpoint"
check_status "resources/list" "Resources endpoint"  
check_status "prompts/list" "Prompts endpoint"

echo ""
echo "Testing Homey tools:"

# Test a specific tool
echo -n "Testing get_homey_zones tool... "
request='{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "get_homey_zones", "arguments": {}}}'
response=$(echo "$request" | node src/server.js 2>/dev/null)

if echo "$response" | grep -q '"content"'; then
    echo "${GREEN}✅ OK${NC}"
    zone_count=$(echo "$response" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo "   Found $zone_count zones"
else
    echo "${RED}❌ ERROR${NC}"
    if echo "$response" | grep -q '"error"'; then
        echo "   Error: $(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
    fi
fi

echo ""
echo "Environment check:"
if [ -n "$HOMEY_TOKEN" ]; then
    echo "${GREEN}✅${NC} HOMEY_TOKEN is set"
else
    echo "${YELLOW}⚠️${NC}  HOMEY_TOKEN not found in environment"
fi

if [ -n "$HOMEY_ID" ]; then
    echo "${GREEN}✅${NC} HOMEY_ID is set"
else
    echo "${YELLOW}⚠️${NC}  HOMEY_ID not found in environment"
fi

if [ -f ".env" ]; then
    echo "${GREEN}✅${NC} .env file exists"
    if grep -q "HOMEY_TOKEN=" .env; then
        echo "${GREEN}✅${NC} HOMEY_TOKEN found in .env"
    fi
    if grep -q "HOMEY_ID=" .env; then
        echo "${GREEN}✅${NC} HOMEY_ID found in .env"
    fi
else
    echo "${YELLOW}⚠️${NC}  .env file not found"
fi

echo ""
echo "MCP Server Status Check Complete!"
