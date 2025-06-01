#!/usr/bin/env node

import { config } from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Homey } from "./services/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in project root
config({ path: path.join(__dirname, "..", ".env") });

class HomeyMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "homey-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.homey = null;
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_homey_devices",
            description: "Get all devices from your Homey hub",
            inputSchema: {
              type: "object",
              properties: {
                zone: {
                  type: "string",
                  description: "Optional: Filter devices by zone name",
                },
              },
            },
          },
          {
            name: "get_homey_zones",
            description: "Get all zones from your Homey hub",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_homey_variables",
            description: "Get all logic variables from your Homey hub",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Optional: Filter variables by name",
                },
              },
            },
          },
          {
            name: "search_homey_devices",
            description: "Search for devices by name, class, or capabilities",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description:
                    "Search query for device name, class, or capabilities",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "get_temperature",
            description:
              "Get current temperature readings from devices with temperature sensors",
            inputSchema: {
              type: "object",
              properties: {
                deviceId: {
                  type: "string",
                  description:
                    "Optional: Get temperature from a specific device ID",
                },
                zone: {
                  type: "string",
                  description:
                    "Optional: Filter temperature devices by zone name",
                },
              },
            },
          },
        ],
      };
    });

    // List available resources (empty for now)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [],
      };
    });

    // List available prompts (empty for now)
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_homey_devices":
            return await this.getDevices(args);
          case "get_homey_zones":
            return await this.getZones(args);
          case "get_homey_variables":
            return await this.getVariables(args);
          case "search_homey_devices":
            return await this.searchDevices(args);
          case "get_temperature":
            return await this.getTemperature(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  initializeHomey() {
    if (this.homey) return this.homey;

    const token = process.env.HOMEY_TOKEN;
    const homeyId = process.env.HOMEY_ID;

    if (!token || !homeyId) {
      throw new Error(
        "HOMEY_TOKEN and HOMEY_ID environment variables are required"
      );
    }

    this.homey = new Homey(token, homeyId, {
      cache: true,
      readFromCache: true,
      cacheDir: path.join(__dirname, "..", "cache"),
    });

    return this.homey;
  }

  async getDevices(args) {
    const homey = this.initializeHomey();
    const devices = await homey.getDevices();

    let filteredDevices = devices.items;

    if (args.zone) {
      filteredDevices = devices.items.filter(
        (device) =>
          device.zoneName &&
          device.zoneName.toLowerCase().includes(args.zone.toLowerCase())
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              total: filteredDevices.length,
              devices: filteredDevices.map((device) => ({
                id: device.id,
                name: device.name,
                class: device.class,
                zone: device.zoneName,
                capabilities: device.capabilities,
                ready: device.ready,
                available: device.available,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getZones(args) {
    const homey = this.initializeHomey();
    const zones = await homey.getZones();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              total: zones.items.length,
              zones: zones.items.map((zone) => ({
                id: zone.id,
                name: zone.name,
                parent: zone.parent,
                active: zone.active,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getVariables(args) {
    const homey = this.initializeHomey();
    const variables = await homey.getLogicVariables();

    let filteredVariables = variables.items;

    if (args.name) {
      filteredVariables = variables.items.filter(
        (variable) =>
          variable.name &&
          variable.name.toLowerCase().includes(args.name.toLowerCase())
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              total: filteredVariables.length,
              variables: filteredVariables.map((variable) => ({
                id: variable.id,
                name: variable.name,
                type: variable.type,
                value: variable.value,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async searchDevices(args) {
    const homey = this.initializeHomey();
    const devices = await homey.getDevices();

    const query = args.query.toLowerCase();
    const filteredDevices = devices.items.filter((device) => {
      return (
        (device.name && device.name.toLowerCase().includes(query)) ||
        (device.class && device.class.toLowerCase().includes(query)) ||
        (device.capabilities &&
          device.capabilities.some((cap) => cap.toLowerCase().includes(query)))
      );
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              query: args.query,
              total: filteredDevices.length,
              devices: filteredDevices.map((device) => ({
                id: device.id,
                name: device.name,
                class: device.class,
                zone: device.zoneName,
                capabilities: device.capabilities,
                ready: device.ready,
                available: device.available,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getTemperature(args) {
    const homey = this.initializeHomey();
    const devices = await homey.getDevices();

    // If specific device ID is requested
    if (args.deviceId) {
      const device = devices.items.find((d) => d.id === args.deviceId);

      if (!device) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Device with ID ${args.deviceId} not found`
        );
      }

      // Verify device has temperature sensor
      if (
        !device.capabilities ||
        !device.capabilities.includes("measure_temperature")
      ) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Device "${device.name}" (${device.id}) does not have a temperature sensor`
        );
      }

      // Get temperature value from device capabilities
      const temperatureValue =
        device._rawData?.capabilitiesObj?.measure_temperature?.value;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                deviceId: device.id,
                deviceName: device.name,
                zone: device.zoneName,
                temperature: temperatureValue,
                unit: "°C",
                lastUpdated:
                  device._rawData?.capabilitiesObj?.measure_temperature
                    ?.lastUpdated,
                available: device.available,
                ready: device.ready,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Filter devices that have temperature sensors
    let temperatureDevices = devices.items.filter(
      (device) =>
        device.capabilities &&
        device.capabilities.includes("measure_temperature")
    );

    // Filter by zone if specified
    if (args.zone) {
      temperatureDevices = temperatureDevices.filter(
        (device) =>
          device.zoneName &&
          device.zoneName.toLowerCase().includes(args.zone.toLowerCase())
      );
    }

    // Map temperature data
    const temperatureReadings = temperatureDevices.map((device) => {
      const temperatureValue =
        device._rawData?.capabilitiesObj?.measure_temperature?.value;
      const lastUpdated =
        device._rawData?.capabilitiesObj?.measure_temperature?.lastUpdated;

      return {
        id: device.id,
        name: device.name,
        zone: device.zoneName,
        temperature: temperatureValue,
        unit: "°C",
        lastUpdated: lastUpdated,
        available: device.available,
        ready: device.ready,
      };
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              query: args.zone ? `Zone: ${args.zone}` : "All zones",
              total: temperatureReadings.length,
              temperatures: temperatureReadings,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async run() {
    // Ensure cache directory exists
    const cacheDir = path.join(__dirname, "..", "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
      // Debug message removed for MCP compatibility
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // Server ready message removed for MCP compatibility
  }
}

// Start the server
const server = new HomeyMCPServer();
server.run().catch(console.error);
