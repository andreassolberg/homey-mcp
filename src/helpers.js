// Helper functions for Homey data processing
import { Items } from "./models/index.js";

/**
 * Get all items from Homey (devices and logic variables combined)
 */
async function getAllHomeyItems(homey) {
  try {
    const [devices, variables] = await Promise.all([
      homey.getDevices(),
      homey.getLogicVariables(),
    ]);

    // Combine devices and variables into a single Items collection
    const combinedItems = [...devices.items, ...variables.items];
    return new Items(combinedItems, devices.zones);
  } catch (error) {
    console.error("Error fetching Homey items:", error.message);
    throw error;
  }
}


/**
 * Get the presence/motion value from a device or variable
 */
function getPresenceValue(item) {
  if (!item) {
    return null;
  }

  // For devices, try different capability types
  if (item.hasCapability && typeof item.getValue === "function") {
    const motionValue = item.getValue("alarm_motion");
    if (motionValue) {
      return motionValue.value;
    }

    const presenceValue = item.getValue("alarm_presence");
    if (presenceValue) {
      return presenceValue.value;
    }

    const onoffValue = item.getValue("onoff");
    if (onoffValue) {
      return onoffValue.value;
    }
  }

  // For logic variables, get the value directly
  if (item.type && item.value !== undefined) {
    if (item.type === "boolean") {
      return item.value;
    }
    // Convert other types to boolean if needed
    if (typeof item.value === "string") {
      return item.value.toLowerCase() === "true" || item.value === "1";
    }
    if (typeof item.value === "number") {
      return item.value !== 0;
    }
  }

  return null;
}

/**
 * Get the temperature value from a device or variable
 */
function getTemperatureValue(item) {
  if (!item) {
    return null;
  }

  // For devices, try temperature capability
  if (item.hasCapability && typeof item.getValue === "function") {
    const temperatureValue = item.getValue("measure_temperature");
    if (temperatureValue) {
      return temperatureValue.value;
    }
  }

  // For logic variables, get the value directly
  if (item.type && item.value !== undefined) {
    if (item.type === "number") {
      return item.value;
    }
    // Try to parse string as number
    if (typeof item.value === "string") {
      const parsed = parseFloat(item.value);
      return !isNaN(parsed) ? parsed : null;
    }
  }

  return null;
}

export { getAllHomeyItems, getPresenceValue, getTemperatureValue };
