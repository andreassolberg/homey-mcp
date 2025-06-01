# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js Model Context Protocol (MCP) server that integrates with Homey Pro smart home systems. The server exposes Homey devices, zones, variables, and logic flows through the MCP protocol for use with Claude Desktop and other MCP-compatible clients.

## Essential Commands

```bash
# Development and testing
npm start                    # Run standalone test script (src/index.js)
npm run mcp                  # Start MCP server (src/server.js)
npm run data                 # Run data script with file watching

# Testing scripts (run from project root)
./scripts/test-mcp.sh        # Comprehensive MCP server testing
./scripts/verify-mcp.sh      # Quick verification
./scripts/test-temperature.sh # Test temperature functions specifically
./scripts/interactive-test.sh # Interactive testing interface
./scripts/status-check.sh    # Check server status
./scripts/final-verification.sh # Final comprehensive test
```

## Architecture

### Core Components

- **src/server.js**: Main MCP server implementation using @modelcontextprotocol/sdk
- **src/services/Homey.js**: Homey API client with caching capabilities
- **src/models/**: Data models organized by class
  - **Entity.js**: Base entity class
  - **Device.js**: Device model with capabilities and zone mapping
  - **Zone.js**: Zone model for Homey areas
  - **Variable.js**: Logic variable model
  - **Items.js**: Collection wrapper with utility methods
  - **Value.js**: Value wrapper for device capabilities
- **src/index.js**: Standalone test script for development
- **src/data.js**: Data endpoint implementation
- **src/helpers.js**: Helper functions for data processing

### Key Design Patterns

1. **Caching System**: Automatic JSON file caching in `cache/` directory to reduce API calls
2. **MCP Tools**: Five main tools exposed - get_homey_devices, get_homey_zones, get_homey_variables, search_homey_devices, get_temperature
3. **Entity Classes**: Modular class structure with base Entity class and specialized subclasses (Device, Zone, Variable) with utility methods like `print()`, `filter()`, `getItem()`
4. **Environment Configuration**: Uses .env file for HOMEY_TOKEN and HOMEY_ID

### Critical Implementation Details

- **No Debug Output**: All console.log/debug statements removed from server.js for MCP JSON compatibility
- **ES Modules**: Project uses `"type": "module"` - all imports use ES6 syntax
- **Path Handling**: Uses fileURLToPath and path.join for cross-platform compatibility
- **Error Handling**: McpError exceptions with proper error codes for MCP protocol

## Development Environment

### Required Environment Variables (.env file)
```
HOMEY_TOKEN=your_api_token_here
HOMEY_ID=your_homey_id_here
```

### Cache Directory Structure
```
cache/
├── devices.json     # Device cache
├── zones.json       # Zone cache
├── variables.json   # Logic variables cache
└── logic.json       # Logic flows cache
```

### MCP Server Integration
The server integrates with Claude Desktop via configuration in `claude_desktop_config.json`. The server communicates via stdio and expects clean JSON responses (no debug output to stdout).

## Testing Approach

All testing is done via shell scripts that send JSON-RPC requests to the MCP server. The test scripts use `jq` for JSON formatting when available. Tests cover all five MCP tools with various parameter combinations.