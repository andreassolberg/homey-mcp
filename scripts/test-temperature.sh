#!/usr/bin/env zsh

# Test script for the new get_temperature tool

echo "🌡️  Testing get_temperature Tool"
echo "================================"

cd "$(dirname "$0")/."

# Function to send MCP request
send_mcp_request() {
    local request="$1"
    local description="$2"
    
    echo "📡 $description"
    echo "Response:"
    
    local output
    output=$(echo "$request" | node src/server.js 2>/dev/null | tail -1)
    
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

# Test 1: Get all temperature readings
send_mcp_request '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "get_temperature", "arguments": {}}}' "Getting all temperature readings"

# Test 2: Get temperature for a specific device (valid temperature sensor)
send_mcp_request '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_temperature", "arguments": {"deviceId": "00caa90c-f5b9-4591-8f52-68557b039017"}}}' "Getting temperature for specific device"

# Test 3: Try to get temperature from a device without temperature sensor
send_mcp_request '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "get_temperature", "arguments": {"deviceId": "066eaa4d-951c-4390-9c11-5b6f3f30fe63"}}}' "Testing error handling for device without temperature sensor"

# Test 4: Try to get temperature from invalid device ID
send_mcp_request '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "get_temperature", "arguments": {"deviceId": "invalid-device-id"}}}' "Testing error handling for invalid device ID"

# Test 5: Get temperature readings by zone (if any exist)
send_mcp_request '{"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"name": "get_temperature", "arguments": {"zone": "Stue"}}}' "Getting temperature readings from living room zone"

echo "✅ Temperature tool tests completed!"
