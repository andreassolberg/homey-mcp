import dotenv from "dotenv";
import { Homey } from "./services/index.js";
import { colorize as jsonColorizer } from "json-colorizer";
import Database from "./services/Database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Load configuration from file
function loadConfig() {
  const configPath = path.join(__dirname, "..", "config", "status.json");
  let fileConfig = {};
  
  if (fs.existsSync(configPath)) {
    try {
      const configData = fs.readFileSync(configPath, "utf8");
      fileConfig = JSON.parse(configData);
    } catch (error) {
      console.error(`Warning: Could not read config file ${configPath}:`, error.message);
    }
  }
  
  return {
    batteryThreshold: 20, // Low battery threshold percentage
    staleHoursThreshold: 24, // Hours since last update to consider device stale
    showAllDevices: false, // Whether to show all devices or just problematic ones
    showOfflineDevices: true, // Whether to show offline/unavailable devices
    deviceIds: [], // Specific device IDs to dump for debugging
    ignore: [], // Device IDs to ignore in main status but show separately
    deviceClass: null, // Filter by specific device class
    ...fileConfig // Override defaults with file config
  };
}

const DEFAULT_CONFIG = loadConfig();

function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--battery-threshold":
        config.batteryThreshold = parseInt(args[++i]) || DEFAULT_CONFIG.batteryThreshold;
        break;
      case "--stale-hours":
        config.staleHoursThreshold = parseInt(args[++i]) || DEFAULT_CONFIG.staleHoursThreshold;
        break;
      case "--show-all":
        config.showAllDevices = true;
        break;
      case "--hide-offline":
        config.showOfflineDevices = false;
        break;
      case "--device":
        // Collect all following arguments that don't start with --
        while (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          config.deviceIds.push(args[++i]);
        }
        break;
      case "--class":
        config.deviceClass = args[++i];
        break;
      case "--help":
        console.log(`
Homey Device Status Monitor

Usage: node src/status.js [options]

Options:
  --battery-threshold <number>  Low battery threshold percentage (default: ${DEFAULT_CONFIG.batteryThreshold})
  --stale-hours <number>        Hours since last update to consider stale (default: ${DEFAULT_CONFIG.staleHoursThreshold})
  --show-all                    Show all devices, not just problematic ones
  --hide-offline                Hide offline/unavailable devices
  --class <type>                Filter devices by class (e.g., sensor, light, speaker)
  --device <id> [id2] [id3...]  Dump raw device object(s) for debugging (overrides other display options)
  --help                        Show this help message

Configuration:
  Default values can be set in config/status.json
  Command line options override config file settings

Examples:
  node src/status.js                                    # Use default settings
  node src/status.js --battery-threshold 15            # Alert when battery < 15%
  node src/status.js --stale-hours 48                   # Alert when not updated in 48 hours
  node src/status.js --show-all --battery-threshold 10  # Show all devices, battery alert < 10%
  node src/status.js --class sensor                     # Show only sensor devices
  node src/status.js --class light --show-all          # Show all light devices
  node src/status.js --device 00caa90c-f5b9-4591-8f52-68557b039017  # Debug specific device
  node src/status.js --device id1 id2 id3              # Debug multiple devices
        `);
        process.exit(0);
    }
  }

  return config;
}

// json-colorizer configuration
const colorizerOptions = {
  colors: {
    BRACE: 'gray',
    BRACKET: 'gray', 
    COLON: 'gray',
    COMMA: 'gray',
    STRING_KEY: 'blue',
    STRING_LITERAL: 'green', 
    NUMBER_LITERAL: 'yellow',
    BOOLEAN_LITERAL: 'cyan',
    NULL_LITERAL: 'red'
  }
};

function prettyPrintDevice(device) {
  const deviceData = device._rawData;
  
  // Header with device name and ID
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`Device: ${device.name} (${device.id})`);
  console.log(`${'═'.repeat(80)}\n`);
  
  // Basic info section
  console.log('📱 Basic Information:');
  console.log('────────────────────');
  const basicInfo = {
    name: device.name,
    id: device.id,
    class: device.class,
    zone: device.zoneName || 'Unknown',
    zoneId: device.zone,
    available: device.available,
    driverId: device.driverId
  };
  console.log(jsonColorizer(JSON.stringify(basicInfo, null, 2), colorizerOptions));
  
  // Capabilities section with current values
  if (deviceData.capabilitiesObj && Object.keys(deviceData.capabilitiesObj).length > 0) {
    console.log('\n🔧 Current Capabilities & Values:');
    console.log('──────────────────────────────────');
    
    const capabilities = {};
    Object.entries(deviceData.capabilitiesObj).forEach(([key, capability]) => {
      capabilities[key] = {
        value: capability.value,
        units: capability.units || null,
        lastUpdated: capability.lastUpdated ? new Date(capability.lastUpdated).toISOString() : null,
        timeAgo: capability.lastUpdated ? formatTimeAgo(capability.lastUpdated) : null
      };
    });
    console.log(jsonColorizer(JSON.stringify(capabilities, null, 2), colorizerOptions));
  }
  
  // Settings section
  if (deviceData.settings && Object.keys(deviceData.settings).length > 0) {
    console.log('\n⚙️  Device Settings:');
    console.log('──────────────────');
    console.log(jsonColorizer(JSON.stringify(deviceData.settings, null, 2), colorizerOptions));
  }
  
  // Full raw data section
  console.log('\n🔍 Complete Device Object:');
  console.log('──────────────────────────');
  console.log(jsonColorizer(JSON.stringify(deviceData, null, 2), colorizerOptions));
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes}m ago`;
  }
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes}m ago`;
  }
}

function getDeviceStatus(device, config) {
  const status = {
    hasIssues: false,
    lowBattery: false,
    isStale: false,
    isOffline: !device.available,
    batteryLevel: null,
    lastUpdate: null,
    mostRecentTimestamp: 0,
    lastUpdateHoursAgo: null,
    isLowBattery: false,
  };

  // Check battery level
  if (device.hasCapability("measure_battery")) {
    const batteryValue = device.getValue("measure_battery");
    if (batteryValue && batteryValue.value !== null) {
      status.batteryLevel = batteryValue.value;
      if (status.batteryLevel < config.batteryThreshold) {
        status.lowBattery = true;
        status.isLowBattery = true;
        status.hasIssues = true;
      }
    }
  }

  // Find most recent update across all capabilities
  if (device._rawData.capabilitiesObj) {
    Object.values(device._rawData.capabilitiesObj).forEach((capability) => {
      if (capability.lastUpdated && capability.lastUpdated > status.mostRecentTimestamp) {
        status.mostRecentTimestamp = capability.lastUpdated;
      }
    });
  }

  // Check if device is stale
  if (status.mostRecentTimestamp > 0) {
    const hoursAgo = (Date.now() - status.mostRecentTimestamp) / (1000 * 60 * 60);
    status.lastUpdateHoursAgo = hoursAgo;
    if (hoursAgo > config.staleHoursThreshold) {
      status.isStale = true;
      status.hasIssues = true;
    }
    status.lastUpdate = status.mostRecentTimestamp;
  }

  // Offline devices are always an issue
  if (status.isOffline) {
    status.hasIssues = true;
  }

  return status;
}

function createDeviceTable(devices, config, recentIssuesMap = new Map()) {
  const tableData = [];
  
  devices.forEach((device) => {
    const status = getDeviceStatus(device, config);
    
    // Filter by device class if specified
    if (config.deviceClass && device.class !== config.deviceClass) {
      return;
    }
    
    // Filter based on configuration
    if (!config.showAllDevices && !status.hasIssues) {
      return;
    }
    
    if (!config.showOfflineDevices && status.isOffline) {
      return;
    }

    // Get zone information
    const zoneId = device.zone || device._rawData.zone;
    let zoneName = "Unknown";
    if (zoneId && device.zoneMap && device.zoneMap.has(zoneId)) {
      const zone = device.zoneMap.get(zoneId);
      zoneName = zone.name;
    }

    // Create status indicators
    const indicators = [];
    if (status.isOffline) indicators.push("OFFLINE");
    if (status.lowBattery) indicators.push(`LOW_BAT(${status.batteryLevel}%)`);
    if (status.isStale) indicators.push("STALE");

    const battery = status.batteryLevel !== null ? `${status.batteryLevel}%` : "N/A";
    const lastUpdate = status.lastUpdate ? formatTimestamp(status.lastUpdate) : "N/A";
    const statusText = indicators.length > 0 ? indicators.join(" | ") : "OK";
    const failedRecently = recentIssuesMap.has(device.id) ? "Yes" : "No";

    tableData.push({
      id: device.id,
      device: device.name,
      zone: zoneName,
      class: device.class || "unknown",
      available: device.available ? "✓" : "✗",
      battery: battery,
      lastUpdate: lastUpdate,
      status: statusText,
      failedRecently: failedRecently,
    });
  });

  return tableData;
}

function printTable(tableData, options = {}) {
  if (tableData.length === 0) {
    console.log("No devices found matching the criteria.");
    return;
  }
  
  const { grayText = false, title = "" } = options;

  // Calculate column widths
  const maxIdLength = Math.max(...tableData.map((d) => d.id.length), "ID".length);
  const maxDeviceLength = Math.max(...tableData.map((d) => d.device.length), "Device".length);
  const maxZoneLength = Math.max(...tableData.map((d) => d.zone.length), "Zone".length);
  const maxClassLength = Math.max(...tableData.map((d) => d.class.length), "Class".length);
  const maxAvailableLength = Math.max(...tableData.map((d) => d.available.length), "Online".length);
  const maxBatteryLength = Math.max(...tableData.map((d) => d.battery.length), "Battery".length);
  const maxLastUpdateLength = Math.max(...tableData.map((d) => d.lastUpdate.length), "Last Update".length);
  const maxStatusLength = Math.max(...tableData.map((d) => d.status.length), "Status".length);
  const maxFailedRecentlyLength = tableData.length > 0 && tableData[0].failedRecently !== undefined ? Math.max(...tableData.map((d) => d.failedRecently.length), "Failed Recently".length) : 0;

  // Print header with subtle dimming for ignored devices
  const dimColor = grayText ? '\x1b[2m' : ''; // Dim text instead of gray
  const resetColor = grayText ? '\x1b[0m' : '';
  
  if (title) {
    console.log(`\n${title}`); // Title stays normal
  }
  
  const hasFailedRecentlyColumn = tableData.length > 0 && tableData[0].failedRecently !== undefined;
  
  console.log(`${dimColor}`);
  if (hasFailedRecentlyColumn) {
    console.log(
      `${"ID".padEnd(maxIdLength)} | ${"Device".padEnd(maxDeviceLength)} | ${"Zone".padEnd(maxZoneLength)} | ${"Class".padEnd(maxClassLength)} | ${"Online".padEnd(maxAvailableLength)} | ${"Battery".padEnd(maxBatteryLength)} | ${"Last Update".padEnd(maxLastUpdateLength)} | ${"Status".padEnd(maxStatusLength)} | ${"Failed Recently".padEnd(maxFailedRecentlyLength)}`
    );
  } else {
    console.log(
      `${"ID".padEnd(maxIdLength)} | ${"Device".padEnd(maxDeviceLength)} | ${"Zone".padEnd(maxZoneLength)} | ${"Class".padEnd(maxClassLength)} | ${"Online".padEnd(maxAvailableLength)} | ${"Battery".padEnd(maxBatteryLength)} | ${"Last Update".padEnd(maxLastUpdateLength)} | ${"Status".padEnd(maxStatusLength)}`
    );
  }
  if (hasFailedRecentlyColumn) {
    console.log(
      `${"-".repeat(maxIdLength)}-|-${"-".repeat(maxDeviceLength)}-|-${"-".repeat(maxZoneLength)}-|-${"-".repeat(maxClassLength)}-|-${"-".repeat(maxAvailableLength)}-|-${"-".repeat(maxBatteryLength)}-|-${"-".repeat(maxLastUpdateLength)}-|-${"-".repeat(maxStatusLength)}-|-${"-".repeat(maxFailedRecentlyLength)}`
    );
  } else {
    console.log(
      `${"-".repeat(maxIdLength)}-|-${"-".repeat(maxDeviceLength)}-|-${"-".repeat(maxZoneLength)}-|-${"-".repeat(maxClassLength)}-|-${"-".repeat(maxAvailableLength)}-|-${"-".repeat(maxBatteryLength)}-|-${"-".repeat(maxLastUpdateLength)}-|-${"-".repeat(maxStatusLength)}`
    );
  }

  // Print data rows
  tableData.forEach((row) => {
    if (hasFailedRecentlyColumn) {
      console.log(
        `${row.id.padEnd(maxIdLength)} | ${row.device.padEnd(maxDeviceLength)} | ${row.zone.padEnd(maxZoneLength)} | ${row.class.padEnd(maxClassLength)} | ${row.available.padEnd(maxAvailableLength)} | ${row.battery.padEnd(maxBatteryLength)} | ${row.lastUpdate.padEnd(maxLastUpdateLength)} | ${row.status.padEnd(maxStatusLength)} | ${row.failedRecently.padEnd(maxFailedRecentlyLength)}`
      );
    } else {
      console.log(
        `${row.id.padEnd(maxIdLength)} | ${row.device.padEnd(maxDeviceLength)} | ${row.zone.padEnd(maxZoneLength)} | ${row.class.padEnd(maxClassLength)} | ${row.available.padEnd(maxAvailableLength)} | ${row.battery.padEnd(maxBatteryLength)} | ${row.lastUpdate.padEnd(maxLastUpdateLength)} | ${row.status.padEnd(maxStatusLength)}`
      );
    }
  });
  
  console.log(`${resetColor}`);
}

function createRecoveredDevicesTable(recoveredDevices) {
  const tableData = [];
  
  recoveredDevices.forEach((device) => {
    const lastIssue = device.last_issue ? formatTimestamp(new Date(device.last_issue).getTime()) : "N/A";
    
    tableData.push({
      id: device.device_id,
      device: device.device_name,
      zone: device.zone || "Unknown",
      class: device.device_class || "unknown",
      lastIssue: lastIssue,
      status: "Recovered",
    });
  });

  return tableData;
}

function printRecoveredTable(tableData, options = {}) {
  if (tableData.length === 0) {
    return;
  }
  
  const { title = "" } = options;

  // Calculate column widths
  const maxIdLength = Math.max(...tableData.map((d) => d.id.length), "ID".length);
  const maxDeviceLength = Math.max(...tableData.map((d) => d.device.length), "Device".length);
  const maxZoneLength = Math.max(...tableData.map((d) => d.zone.length), "Zone".length);
  const maxClassLength = Math.max(...tableData.map((d) => d.class.length), "Class".length);
  const maxLastIssueLength = Math.max(...tableData.map((d) => d.lastIssue.length), "Last Issue".length);
  const maxStatusLength = Math.max(...tableData.map((d) => d.status.length), "Status".length);

  if (title) {
    console.log(`\n${title}`);
  }
  
  console.log(
    `$("ID".padEnd(maxIdLength)} | $("Device".padEnd(maxDeviceLength)} | $("Zone".padEnd(maxZoneLength)} | $("Class".padEnd(maxClassLength)} | $("Last Issue".padEnd(maxLastIssueLength)} | $("Status".padEnd(maxStatusLength)}`
  );
  console.log(
    `${"-".repeat(maxIdLength)}-|-${"-".repeat(maxDeviceLength)}-|-${"-".repeat(maxZoneLength)}-|-${"-".repeat(maxClassLength)}-|-${"-".repeat(maxLastIssueLength)}-|-${"-".repeat(maxStatusLength)}`
  );

  // Print data rows
  tableData.forEach((row) => {
    console.log(
      `$(row.id.padEnd(maxIdLength)} | $(row.device.padEnd(maxDeviceLength)} | $(row.zone.padEnd(maxZoneLength)} | $(row.class.padEnd(maxClassLength)} | $(row.lastIssue.padEnd(maxLastIssueLength)} | $(row.status.padEnd(maxStatusLength)}`
    );
  });
}

async function main() {
  const config = parseArgs();

  console.log("Homey Device Status Monitor");
  console.log("===========================");
  console.log(`Battery threshold: ${config.batteryThreshold}%`);
  console.log(`Stale threshold: ${config.staleHoursThreshold} hours`);
  console.log(`Show all devices: ${config.showAllDevices ? "Yes" : "No"}`);
  console.log(`Show offline devices: ${config.showOfflineDevices ? "Yes" : "No"}`);
  if (config.deviceClass) {
    console.log(`Filter by class: ${config.deviceClass}`);
  }
  console.log("");

  const homey = new Homey(process.env.HOMEY_TOKEN, process.env.HOMEY_ID, {
    cache: true,         // Keep writing to cache (updates it with fresh data)
    readFromCache: false // Never read from cache - always fetch fresh data
  });

  // Initialize database
  const database = new Database();
  try {
    await database.init();
  } catch (error) {
    console.error("Failed to initialize database:", error.message);
    process.exit(1);
  }

  try {
    console.log("Fetching devices...");
    const devices = await homey.getDevices();
    console.log(`Found ${devices.length} total devices`);

    // Record all device statuses to database
    console.log("Recording device statuses to database...");
    const recordPromises = devices.items.map(async (device) => {
      const status = getDeviceStatus(device, config);
      
      // Get zone information
      const zoneId = device.zone || device._rawData.zone;
      let zoneName = "Unknown";
      if (zoneId && device.zoneMap && device.zoneMap.has(zoneId)) {
        const zone = device.zoneMap.get(zoneId);
        zoneName = zone.name;
      }
      
      return database.recordDeviceStatus(
        device.id,
        device.name,
        zoneName,
        device.class || "unknown",
        !status.hasIssues,
        {
          batteryLevel: status.batteryLevel,
          lastUpdateHoursAgo: status.lastUpdateHoursAgo,
          isOffline: status.isOffline,
          isStale: status.isStale,
          isLowBattery: status.isLowBattery
        }
      );
    });
    
    await Promise.all(recordPromises);
    console.log("Device statuses recorded successfully.");

    // Get devices with recent issues for Failed Recently column
    const recentIssuesDevices = await database.getDevicesWithRecentIssues(7);
    const recentIssuesMap = new Map(recentIssuesDevices.map(d => [d.device_id, true]));
    
    // Get recovered devices
    const recoveredDevices = await database.getRecoveredDevices(7);

    // Check if device dump mode is enabled
    if (config.deviceIds && config.deviceIds.length > 0) {
      console.log(`\nDumping ${config.deviceIds.length} specific device(s):`);
      
      let foundCount = 0;
      for (const deviceId of config.deviceIds) {
        const device = devices.items.find(d => d.id === deviceId);
        if (device) {
          prettyPrintDevice(device);
          foundCount++;
        } else {
          console.log(`\n❌ Device with ID '${deviceId}' not found.`);
        }
      }
      
      console.log(`\n📊 Summary: Found ${foundCount} of ${config.deviceIds.length} requested devices.`);
      return;
    }

    // Normal status table mode
    const allTableData = createDeviceTable(devices.items, config, recentIssuesMap);
    
    // Split devices into main and ignored
    const mainTableData = allTableData.filter(row => !config.ignore.includes(row.id));
    const ignoredTableData = allTableData.filter(row => config.ignore.includes(row.id));
    
    // Sort function
    const sortTableData = (data) => {
      data.sort((a, b) => {
        // Issues first
        const aHasIssue = a.status !== "OK";
        const bHasIssue = b.status !== "OK";
        if (aHasIssue !== bHasIssue) {
          return bHasIssue - aHasIssue; // Issues first
        }
        
        // Then by zone
        if (a.zone !== b.zone) {
          return a.zone.localeCompare(b.zone);
        }
        
        // Finally by device name
        return a.device.localeCompare(b.device);
      });
    };

    // Sort both tables
    sortTableData(mainTableData);
    sortTableData(ignoredTableData);

    // Print main table
    if (mainTableData.length > 0) {
      printTable(mainTableData);
    } else {
      console.log("\nNo devices found matching the criteria (excluding ignored devices).");
    }
    
    // Print recovered devices table
    const recoveredTableData = createRecoveredDevicesTable(recoveredDevices);
    if (recoveredTableData.length > 0) {
      printRecoveredTable(recoveredTableData, { 
        title: `\n🔄 Recovered Devices (${recoveredTableData.length} devices - were problematic 7+ days ago but are OK now):` 
      });
    }
    
    // Print ignored devices table with subtle dimming if there are any
    if (ignoredTableData.length > 0) {
      printTable(ignoredTableData, { 
        grayText: true, 
        title: `\n📋 Ignored Devices (${ignoredTableData.length} devices - shown with reduced prominence):` 
      });
    }

    // Summary statistics - filter by class if specified
    let relevantDevices = devices.items;
    if (config.deviceClass) {
      relevantDevices = devices.items.filter(d => d.class === config.deviceClass);
    }
    
    const totalDevices = relevantDevices.length;
    const offlineDevices = relevantDevices.filter(d => !d.available).length;
    const batteryDevices = relevantDevices.filter(d => d.hasCapability("measure_battery")).length;
    const lowBatteryDevices = relevantDevices.filter(d => {
      const status = getDeviceStatus(d, config);
      return status.lowBattery;
    }).length;
    const staleDevices = relevantDevices.filter(d => {
      const status = getDeviceStatus(d, config);
      return status.isStale;
    }).length;

    console.log("\nSummary:");
    if (config.deviceClass) {
      console.log(`Total ${config.deviceClass} devices: ${totalDevices}`);
    } else {
      console.log(`Total devices: ${totalDevices}`);
    }
    console.log(`Ignored devices: ${config.ignore.length}`);
    console.log(`Offline devices: ${offlineDevices}`);
    console.log(`Battery-powered devices: ${batteryDevices}`);
    console.log(`Low battery devices (< ${config.batteryThreshold}%): ${lowBatteryDevices}`);
    console.log(`Stale devices (> ${config.staleHoursThreshold}h): ${staleDevices}`);
    console.log(`Main devices shown: ${mainTableData.length}`);
    if (ignoredTableData.length > 0) {
      console.log(`Ignored devices shown: ${ignoredTableData.length}`);
    }

  } catch (error) {
    console.error("Failed to fetch device status:", error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await database.close();
  }
}

main();