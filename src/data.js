import dotenv from "dotenv";
import express from "express";
import Homey from "./homey.js";
import fs from "fs";
import path from "path";

dotenv.config();

console.log("HOMEY_TOKEN:", process.env.HOMEY_TOKEN);

class House {
  constructor(homey) {
    this.homey = homey;
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

  getData() {
    let data = {};
    return this.config;
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
