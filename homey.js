import fs from "fs";
import { Variable, Device, Items } from "./entities.js";

class Homey {
  constructor(token, homeyId, options = {}) {
    this.token = token;
    this.homeyId = homeyId;
    this.baseUrl = `https://${homeyId}.connect.athom.com`;
    this.useCache = options.cache || false;
    this.readFromCache = options.readFromCache || false;
    this.cacheDir = options.cacheDir || "cache";
  }

  saveToCache(filename, data) {
    if (!this.useCache) return;
    
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    
    const filepath = `${this.cacheDir}/${filename}`;
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`Data saved to ${filepath}`);
  }

  loadFromCache(filename) {
    if (!this.readFromCache) return null;
    
    const filepath = `${this.cacheDir}/${filename}`;
    if (!fs.existsSync(filepath)) {
      console.log(`Cache file ${filepath} not found`);
      return null;
    }
    
    try {
      const data = fs.readFileSync(filepath, 'utf8');
      console.log(`Data loaded from ${filepath}`);
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading cache file ${filepath}:`, error.message);
      return null;
    }
  }

  async _apiCall(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      };
      console.debug("Request URL:", url);
      console.debug("Request Config:", config);

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}${
            errorText ? ` - ${errorText}` : ""
          }`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error.message);
      throw error;
    }
  }

  async getDevices() {
    const cachedData = this.loadFromCache("devices.json");
    if (cachedData) {
      const devices = Object.values(cachedData).map(deviceData => new Device(deviceData));
      return new Items(devices);
    }
    
    const data = await this._apiCall("/api/manager/devices/device");
    this.saveToCache("devices.json", data);
    const devices = Object.values(data).map(deviceData => new Device(deviceData));
    return new Items(devices);
  }

  async getLogicVariables() {
    const cachedData = this.loadFromCache("logic.json");
    if (cachedData) {
      const variables = Object.values(cachedData).map(variableData => new Variable(variableData));
      return new Items(variables);
    }
    
    const data = await this._apiCall("/api/manager/logic/variable/");
    this.saveToCache("logic.json", data);
    const variables = Object.values(data).map(variableData => new Variable(variableData));
    return new Items(variables);
  }
}

export default Homey;
