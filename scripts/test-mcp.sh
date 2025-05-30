#!/usr/bin/env zsh

# Test script for Homey MCP Server

echo "🏠 Testing Homey MCP Server"
echo "=========================="

cd "$(dirname "$0")/.."

# Check if we have the required environment variables
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it with HOMEY_TOKEN and HOMEY_ID"
    exit 1
fi

# Function to send MCP request
send_mcp_request() {
    local request="$1"
    local description="$2"
    
    echo "📡 $description"
    echo "Response:"
    
    # Redirect stderr to capture any error messages separately
    local output
    local error
    
    {
        output=$(echo "$request" | node src/server.js 2>&3 | tail -n +2)
        error=$(echo "" >&3)
    } 3>&2 2>&1
    
    # Try to format JSON if jq is available, otherwise show raw output
    if command -v jq >/dev/null 2>&1; then
        echo "$output" | jq '.' 2>/dev/null || echo "$output"
    else
        echo "$output"
    fi
    
    echo ""
    echo "---"
    echo ""
}

# Test 1: List available tools
send_mcp_request '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' "Listing available tools"

# Test 2: Get zones
send_mcp_request '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_homey_zones", "arguments": {}}}' "Getting all zones"

# Test 3: Get devices
send_mcp_request '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "get_homey_devices", "arguments": {}}}' "Getting all devices"

# Test 4: Get devices for a specific zone
send_mcp_request '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "get_homey_devices", "arguments": {"zone": "Kjøkken"}}}' "Getting devices in kitchen"

# Test 5: Search for light devices
send_mcp_request '{"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"name": "search_homey_devices", "arguments": {"query": "light"}}}' "Searching for light devices"

# Test 6: Get logic variables
send_mcp_request '{"jsonrpc": "2.0", "id": 6, "method": "tools/call", "params": {"name": "get_homey_variables", "arguments": {}}}' "Getting logic variables"

# Test 7: Get temperature readings
send_mcp_request '{"jsonrpc": "2.0", "id": 7, "method": "tools/call", "params": {"name": "get_temperature", "arguments": {}}}' "Getting temperature readings"

echo "✅ All tests completed!"
