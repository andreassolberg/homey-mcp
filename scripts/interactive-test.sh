#!/usr/bin/env zsh

# Interactive MCP Server Tester

echo "🏠 Homey MCP Server - Interactive Tester"
echo "========================================"
echo ""

cd "$(dirname "$0")/."

while true; do
    echo "Velg en test:"
    echo "1) List tools"
    echo "2) Get zones"
    echo "3) Get all devices"
    echo "4) Get devices by zone"
    echo "5) Search devices"
    echo "6) Get logic variables"
    echo "7) Custom JSON request"
    echo "8) Exit"
    echo ""
    read -p "Velg (1-8): " choice

    case $choice in
        1)
            echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node src/server.js
            ;;
        2)
            echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_homey_zones", "arguments": {}}}' | node src/server.js
            ;;
        3)
            echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "get_homey_devices", "arguments": {}}}' | node src/server.js
            ;;
        4)
            read -p "Enter zone name: " zone_name
            echo "{\"jsonrpc\": \"2.0\", \"id\": 4, \"method\": \"tools/call\", \"params\": {\"name\": \"get_homey_devices\", \"arguments\": {\"zone\": \"$zone_name\"}}}" | node src/server.js
            ;;
        5)
            read -p "Enter search query: " search_query
            echo "{\"jsonrpc\": \"2.0\", \"id\": 5, \"method\": \"tools/call\", \"params\": {\"name\": \"search_homey_devices\", \"arguments\": {\"query\": \"$search_query\"}}}" | node src/server.js
            ;;
        6)
            echo '{"jsonrpc": "2.0", "id": 6, "method": "tools/call", "params": {"name": "get_homey_variables", "arguments": {}}}' | node src/server.js
            ;;
        7)
            echo "Enter your JSON request (press Enter twice when done):"
            request=""
            while IFS= read -r line; do
                [[ -z "$line" ]] && break
                request+="$line"
            done
            echo "$request" | node src/server.js
            ;;
        8)
            echo "👋 Bye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please try again."
            ;;
    esac
    
    echo ""
    echo "Press Enter to continue..."
    read
    echo ""
done
