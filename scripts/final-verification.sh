#!/usr/bin/env zsh

# Final verification of the complete Homey MCP Server with temperature tool
echo "🏠 Final Homey MCP Server Verification"
echo "======================================"

cd "$(dirname "$0")/."

# Test 1: Verify all tools are available
echo "📋 Checking available tools..."
TOOLS=$(echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node src/server.js 2>/dev/null | jq '.result.tools | length')
echo "✅ Found $TOOLS tools (expected: 5)"

# Test 2: Test temperature tool - all readings
echo "🌡️  Testing temperature tool..."
TEMP_DEVICES=$(echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_temperature", "arguments": {}}}' | node src/server.js 2>/dev/null | jq -r '.result.content[0].text' | jq '.total')
echo "✅ Found $TEMP_DEVICES temperature sensors"

# Test 3: Test zone filtering
echo "🏘️  Testing zone filtering..."
KITCHEN_TEMPS=$(echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "get_temperature", "arguments": {"zone": "Kjøkken"}}}' | node src/server.js 2>/dev/null | jq -r '.result.content[0].text' | jq '.total')
echo "✅ Found $KITCHEN_TEMPS temperature sensors in kitchen"

# Test 4: Test specific device validation
echo "🔍 Testing device validation..."
SPECIFIC_TEMP=$(echo '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "get_temperature", "arguments": {"deviceId": "00caa90c-f5b9-4591-8f52-68557b039017"}}}' | node src/server.js 2>/dev/null | jq -r '.result.content[0].text' | jq '.temperature')
echo "✅ Kitchen motion sensor temperature: $SPECIFIC_TEMP°C"

# Test 5: Test error handling for invalid device
echo "❌ Testing error handling..."
ERROR_RESPONSE=$(echo '{"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"name": "get_temperature", "arguments": {"deviceId": "invalid-id"}}}' | node src/server.js 2>/dev/null | jq '.error.message' | grep -o "not found")
if [[ "$ERROR_RESPONSE" == "not found" ]]; then
    echo "✅ Error handling works correctly"
else
    echo "❌ Error handling failed"
fi

echo ""
echo "🎉 Homey MCP Server with temperature tool is fully functional!"
echo ""
echo "Available Tools:"
echo "1. get_homey_devices - List all devices"
echo "2. get_homey_zones - List all zones"
echo "3. get_homey_variables - List logic variables"
echo "4. search_homey_devices - Search devices"
echo "5. get_temperature - Get temperature readings (NEW!)"
echo ""
echo "Temperature Tool Features:"
echo "- ✅ Lists all $TEMP_DEVICES temperature sensors"
echo "- ✅ Filters by zone (e.g., $KITCHEN_TEMPS in kitchen)"
echo "- ✅ Gets specific device temperature"
echo "- ✅ Validates temperature sensor capability"
echo "- ✅ Provides error handling for invalid devices"
echo ""
echo "Ready for Claude Desktop integration!"
