class Entity {
  constructor(data, zones = []) {
    this.id = data.id;
    this.name = data.name;
    this._rawData = data;
    this.zones = zones;
    this.zoneMap = new Map();

    // Create a map for quick zone lookup by ID
    if (zones && zones.length > 0) {
      zones.forEach((zone) => {
        this.zoneMap.set(zone.id, zone);
      });
    }
  }

  toJSON() {
    return this._rawData;
  }

  toString() {
    let output = `${this.constructor.name}(id: ${this.id}, name: ${this.name})`;

    // Add zone information if entity has a zone and we have zone data
    if (this._rawData.zone && this.zoneMap.has(this._rawData.zone)) {
      const zone = this.zoneMap.get(this._rawData.zone);
      output += ` (Zone: ${zone.name})`;
    }

    return output;
  }

  print() {
    // Debug: JSON.stringify(this._rawData, null, 2)

    // Add zone information if available
    if (this._rawData.zone && this.zoneMap.has(this._rawData.zone)) {
      const zone = this.zoneMap.get(this._rawData.zone);
      // Debug: Zone info
    }
  }

  hasCapability(capability) {
    return false; // Default implementation
  }

  getValue(type) {
    return null; // Default implementation
  }
}

export default Entity;