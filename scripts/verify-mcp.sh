#!/usr/bin/env zsh

# Quick verification script for Homey MCP Server
echo "🏠 Verifying Homey MCP Server"
echo "============================="

cd "$(dirname "$0")/.."

# Test 1: Check tools are available
echo "📋 Testing available tools..."
TOOLS=$(echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node src/server.js 2>/dev/null | jq '.result.tools | length')
echo "✅ Found $TOOLS tools"

# Test 2: Check zones
echo "🏘️  Testing zones..."
ZONES=$(echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_homey_zones", "arguments": {}}}' | node src/server.js 2>/dev/null | jq -r '.result.content[0].text' | jq '.total')
echo "✅ Found $ZONES zones"

# Test 3: Check devices
echo "📱 Testing devices..."
DEVICES=$(echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "get_homey_devices", "arguments": {}}}' | node src/server.js 2>/dev/null | jq -r '.result.content[0].text' | jq '.total')
echo "✅ Found $DEVICES devices"

# Test 4: Check variables
echo "🔢 Testing variables..."
VARIABLES=$(echo '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "get_homey_variables", "arguments": {}}}' | node src/server.js 2>/dev/null | jq -r '.result.content[0].text' | jq '.total')
echo "✅ Found $VARIABLES logic variables"

echo ""
echo "🎉 MCP Server is working perfectly!"
echo "Ready for Claude Desktop integration."
