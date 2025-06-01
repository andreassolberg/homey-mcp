import dotenv from "dotenv";
import express from "express";
import { Homey } from "./services/index.js";
import {
  getAllHomeyItems,
  getPresenceValue,
  getTemperatureValue,
} from "./helpers.js";
import fs from "fs";
import path from "path";

dotenv.config();

console.log("HOMEY_TOKEN:", process.env.HOMEY_TOKEN);

class House {
  constructor(homey) {
    this.homey = homey;
    this.allItems = null; // Cache for all Homey items
    const configPath = path.resolve("./config/house.json");
    try {
      const configFile = fs.readFileSync(configPath, "utf8");
      this.config = JSON.parse(configFile);
      console.log("House configuration loaded successfully.");
    } catch (error) {
      console.error("Error loading house configuration:", error.message);
      this.config = {};
    }
  }

  async getAllItems() {
    if (!this.allItems) {
      this.allItems = await getAllHomeyItems(this.homey);
    }
    return this.allItems;
  }

  async processRoom(room) {
    // This is a placeholder function for room processing
    // Currently implements: lookup presence device value and temperature device value

    if (room.presence) {
      try {
        // Get all items from Homey (devices and logic variables)
        const allItems = await this.getAllItems();

        // Find the presence item by name or ID
        let presenceItem = allItems.getItemByName(room.presence);
        if (!presenceItem) {
          presenceItem = allItems.getItemById(room.presence);
        }
        
        // Handle binary sensor naming convention
        if (!presenceItem && room.presence.startsWith("binary_sensor.")) {
          const searchName = room.presence
            .replace("binary_sensor.presence_", "")
            .replace("binary_sensor.", "");
          presenceItem = allItems.items.find((item) =>
            item.name.toLowerCase().includes(searchName.toLowerCase())
          );
        }

        if (presenceItem) {
          // Get the presence value from the item
          const presenceValue = getPresenceValue(presenceItem);
          room.presence = presenceValue;

          console.log(
            `Presence for room ${room.label}: ${presenceValue} (from ${presenceItem.name})`
          );
        } else {
          console.warn(
            `Presence item not found for room ${room.label}: ${room.presence}`
          );
          room.presence = null; // Default to null if item not found
        }
      } catch (error) {
        console.error(
          `Error processing presence for room ${room.label}:`,
          error.message
        );
        room.presence = false; // Default to false on error
      }
    }

    // Process temperature lookup
    if (room.temperature) {
      try {
        // Get all items from Homey (devices and logic variables)
        const allItems = await this.getAllItems();

        // Find the temperature item by ID (primary lookup method for temperature)
        let temperatureItem = allItems.getItemById(room.temperature);
        if (!temperatureItem) {
          temperatureItem = allItems.getItemByName(room.temperature);
        }

        if (temperatureItem) {
          // Get the temperature value from the item
          const temperatureValue = getTemperatureValue(temperatureItem);
          room.temperature = temperatureValue;

          console.log(
            `Temperature for room ${room.label}: ${temperatureValue}°C (from ${temperatureItem.name})`
          );
        } else {
          console.warn(
            `Temperature item not found for room ${room.label}: ${room.temperature}`
          );
          room.temperature = null; // Default to null if item not found
        }
      } catch (error) {
        console.error(
          `Error processing temperature for room ${room.label}:`,
          error.message
        );
        room.temperature = null; // Default to null on error
      }
    }

    return room;
  }

  async getData() {
    // Start with the original dataset
    let data = JSON.parse(JSON.stringify(this.config)); // Deep clone to avoid modifying original

    // Process each floor and room
    if (data.floors) {
      for (let floor of data.floors) {
        if (floor.rooms) {
          for (let i = 0; i < floor.rooms.length; i++) {
            floor.rooms[i] = await this.processRoom(floor.rooms[i]);
          }
        }
      }
    }

    return data;
  }

  getConfig() {
    return this.config;
  }
}

async function main() {
  const homey = new Homey(process.env.HOMEY_TOKEN, process.env.HOMEY_ID, {
    cache: true,
    readFromCache: true,
  });
  const house = new House(homey);

  const app = express();
  const port = process.env.PORT || 3000;

  // Root endpoint that returns house data
  app.get("/", async (req, res) => {
    try {
      const houseData = await house.getData();
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(houseData, null, 2));
    } catch (error) {
      console.error("Error getting house data:", error);
      res.status(500).json({ error: "Failed to get house data" });
    }
  });

  app.listen(port, () => {
    console.log(`Express server running on port ${port}`);
    console.log(`House data available at http://localhost:${port}/`);
  });
}

main();
