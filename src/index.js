import dotenv from "dotenv";
import { Homey } from "./services/index.js";

dotenv.config();

console.log("HOMEY_TOKEN:", process.env.HOMEY_TOKEN);

async function main() {
  const homey = new Homey(process.env.HOMEY_TOKEN, process.env.HOMEY_ID, {
    cache: true,
    readFromCache: true,
  });

  try {
    console.log("Fetching devices...");
    const devices = await homey.getDevices();
    console.log(`Found ${devices.length} devices`);
    console.log("First 5 devices:");
    devices.slice(0, 5).print();
  } catch (error) {
    console.error("Failed to fetch devices:", error.message);
  }

  try {
    console.log("\nFetching logic variables...");
    const variables = await homey.getLogicVariables();
    console.log(`Found ${variables.length} logic variables`);
    console.log("First 5 variables:");
    variables.slice(0, 5).print();
  } catch (error) {
    console.error("Failed to fetch logic variables:", error.message);
  }

  try {
    console.log("\nFetching zones...");
    const zones = await homey.getZones();
    console.log(`Found ${zones.length} zones`);
    console.log("First 5 zones:");
    zones.slice(0, 5).print();
  } catch (error) {
    console.error("Failed to fetch zones:", error.message);
  }

  try {
    console.log("\nLooking for specific item...");
    const devices = await homey.getDevices();
    const specificDevice = devices.getItem(
      "00caa90c-f5b9-4591-8f52-68557b039017"
    );
    if (specificDevice) {
      console.log("Found device:");
      specificDevice.print();
    } else {
      console.log(
        "Device with ID '00caa90c-f5b9-4591-8f52-68557b039017' not found"
      );
    }
  } catch (error) {
    console.error("Failed to get specific item:", error.message);
  }

  try {
    console.log(
      "\nFiltering devices with temperature measurement capability..."
    );
    const devices = await homey.getDevices();
    const temperatureDevices = devices.filter((device) =>
      device.hasCapability("measure_temperature")
    );
    console.log(
      `Found ${temperatureDevices.length} devices with temperature measurement capability:`
    );
    temperatureDevices.print();
  } catch (error) {
    console.error("Failed to filter temperature devices:", error.message);
  }

  try {
    console.log("\nShowing temperature values for all temperature devices...");
    const devices = await homey.getDevices();
    const temperatureDevices = devices.filter((device) =>
      device.hasCapability("measure_temperature")
    );

    console.log(
      `Temperature readings from ${temperatureDevices.length} devices:`
    );

    // Create table data
    const tableData = [];
    temperatureDevices.forEach((device) => {
      const temperatureValue = device.getValue("measure_temperature");

      // Get zone information
      const zoneId = device.zone || device._rawData.zone;
      let zoneName = "Unknown";
      if (zoneId && device.zoneMap && device.zoneMap.has(zoneId)) {
        const zone = device.zoneMap.get(zoneId);
        zoneName = zone.name;
      }

      const temperature = temperatureValue
        ? `${temperatureValue.value}°C`
        : "N/A";

      tableData.push({
        device: device.name,
        zone: zoneName,
        temperature: temperature,
      });
    });

    // Sort by zone name, then by device name
    tableData.sort((a, b) => {
      if (a.zone !== b.zone) {
        return a.zone.localeCompare(b.zone);
      }
      return a.device.localeCompare(b.device);
    });

    // Calculate column widths
    const maxDeviceLength = Math.max(
      ...tableData.map((d) => d.device.length),
      "Device".length
    );
    const maxZoneLength = Math.max(
      ...tableData.map((d) => d.zone.length),
      "Zone".length
    );
    const maxTempLength = Math.max(
      ...tableData.map((d) => d.temperature.length),
      "Temperature".length
    );

    // Print header
    console.log("");
    console.log(
      `${"Device".padEnd(maxDeviceLength)} | ${"Zone".padEnd(
        maxZoneLength
      )} | ${"Temperature".padEnd(maxTempLength)}`
    );
    console.log(
      `${"-".repeat(maxDeviceLength)}-|-${"-".repeat(
        maxZoneLength
      )}-|-${"-".repeat(maxTempLength)}`
    );

    // Print data rows
    tableData.forEach((row) => {
      console.log(
        `${row.device.padEnd(maxDeviceLength)} | ${row.zone.padEnd(
          maxZoneLength
        )} | ${row.temperature.padEnd(maxTempLength)}`
      );
    });
  } catch (error) {
    console.error("Failed to get temperature values:", error.message);
  }
}

main();
