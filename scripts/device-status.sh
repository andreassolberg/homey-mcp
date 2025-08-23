#!/bin/bash

# Homey Device Status Check Script
# This script provides a quick device status check for Homey devices.

# Color codes for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏠 Homey Device Status Check${NC}"
echo "============================="

# Change to project root directory
cd "$(dirname "$0")/.."

# Run the status script with passed arguments or default settings
if [ $# -eq 0 ]; then
    echo -e "${BLUE}Using default settings: Battery < 20%, Stale > 24h${NC}"
    echo ""
    npm run status
else
    echo -e "${BLUE}Using custom arguments: $*${NC}"
    echo ""
    npm run status -- "$@"
fi

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Device status check completed successfully.${NC}"
    echo ""
    echo -e "${YELLOW}💡 Available options:${NC}"
    echo "  --battery-threshold <number>  Low battery threshold percentage (default: 20)"
    echo "  --stale-hours <number>        Hours since last update to consider stale (default: 24)"
    echo "  --show-all                    Show all devices, not just problematic ones"
    echo "  --hide-offline                Hide offline/unavailable devices"
    echo "  --help                        Show help message"
else
    echo ""
    echo -e "${RED}❌ Device status check failed with exit code: $EXIT_CODE${NC}"
fi

exit $EXIT_CODE