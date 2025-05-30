# Homey MCP Server

A Model Context Protocol (MCP) server for integrating with Homey Pro smart home system. This server provides access to Homey devices, zones, variables, and logic through the MCP protocol.

## 🏠 Features

- **Devices**: Retrieve and search all Homey devices
- **Zones**: List all zones in your home
- **Variables**: Access to Homey variables
- **Logic**: Retrieve information about logic flows
- **Temperature**: Specialized functions for temperature sensors
- **Cache**: Automatic data caching for better performance

## 📁 Project Structure

```
homey-mcp/
├── src/                     # Main source code
│   ├── server.js           # MCP server main file
│   ├── homey.js           # Homey API client
│   ├── entities.js        # Data models (Device, Zone, Variable, etc.)
│   └── index.js           # Standalone test script
├── scripts/                # Test and verification scripts
│   ├── test-mcp.sh        # Main test script
│   ├── verify-mcp.sh      # Quick verification
│   ├── test-temperature.sh # Test temperature functions
│   ├── interactive-test.sh # Interactive testing
│   ├── status-check.sh    # Status check
│   └── final-verification.sh # Comprehensive test
├── config/                 # Configuration files
│   └── .env.example       # Example environment variables
├── cache/                  # Cache files (auto-generated)
│   ├── devices.json
│   ├── zones.json
│   ├── variables.json
│   └── logic.json
├── .env                    # Your environment variables
├── package.json
├── claude_desktop_config.json # Claude Desktop configuration
└── README.md
```

## 🚀 Setup

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd homey-mcp
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp config/.env.example .env
```

Edit `.env` and add:

- `HOMEY_TOKEN`: Your Homey API token (get this from [Homey Developer Tools](https://tools.developer.homey.app/))
- `HOMEY_ID`: Your Homey ID (found in Homey Pro settings)

### 3. Test the setup

```bash
# Test basic functionality
npm start

# Test MCP server
npm run mcp
```

## 🔧 Usage

### As MCP Server

The server can be used with Claude Desktop or other MCP-compatible clients:

```bash
npm run mcp
```

### As Standalone Script

For testing and development:

```bash
npm start
```

### With Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "homey": {
      "command": "node",
      "args": ["/path/to/homey-mcp/src/server.js"],
      "env": {
        "HOMEY_TOKEN": "your_token_here",
        "HOMEY_ID": "your_homey_id_here"
      }
    }
  }
}
```

## 🛠️ Available Tools

### `get_homey_devices`

Get all devices or filter by zone.

**Parameters:**

- `zone` (optional): Filter devices by zone name

### `search_homey_devices`

Search for devices based on name or properties.

**Parameters:**

- `query`: Search text

### `get_homey_zones`

Get all zones in the home.

### `get_homey_variables`

Get all Homey variables.

### `get_homey_logic`

Get information about logic flows.

### `get_temperature`

Get temperature data from sensors.

**Parameters:**

- `zone` (optional): Filter by zone
- `deviceId` (optional): Get from specific device

## 🧪 Testing

The project includes several test scripts in the `scripts/` folder:

```bash
# Quick verification
./scripts/verify-mcp.sh

# Comprehensive testing
./scripts/test-mcp.sh

# Test temperature functions
./scripts/test-temperature.sh

# Interactive testing
./scripts/interactive-test.sh

# Status check
./scripts/status-check.sh

# Final verification
./scripts/final-verification.sh
```

## 📦 Dependencies

- **@modelcontextprotocol/sdk**: MCP SDK for server implementation
- **dotenv**: Environment variable management

## 🔒 Security

- API tokens and sensitive data are stored in the `.env` file
- Cache files may contain sensitive data and are excluded from git
- Use `.copilotignore` to exclude sensitive files from AI assistance

## 📝 Development

### Adding new features

1. Implement the logic in `src/homey.js`
2. Add MCP tool definition in `src/server.js`
3. Update entities in `src/entities.js` if necessary
4. Create tests in the `scripts/` folder

### Cache handling

The server uses automatic caching to reduce API calls to Homey:

- Cache is stored in the `cache/` folder
- Cache can be enabled/disabled via options
- Cache files are updated automatically when needed

## 🐛 Troubleshooting

1. Check that the `.env` file is correctly configured
2. Verify that Homey Pro is available and online
3. Confirm that the API token has necessary permissions
4. Run test scripts to diagnose problems
5. **MCP compatibility**: Debug messages have been removed from the server to ensure clean JSON communication with Claude Desktop

### Common issues

- **"Unexpected token" error in Claude**: This is caused by debug output to stdout. All console.log/debug messages have been removed from the MCP server.
- **Cache problems**: Delete the `cache/` folder and let the server regenerate the cache files.
- **Environment variable problems**: Check that the `.env` file is in the root folder and contains correct values.

## 📄 License

MIT License
