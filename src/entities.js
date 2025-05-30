class Value {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }

  toString() {
    return `Value(type: ${this.type}, value: ${this.value})`;
  }
}

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

class Variable extends Entity {
  constructor(data, zones = []) {
    super(data, zones);
    this.type = data.type;
    this.value = data.value;
  }

  toString() {
    return `Variable(id: ${this.id}, name: ${this.name}, type: ${this.type}, value: ${this.value})`;
  }

  hasCapability(capability) {
    return capability === "variable";
  }

  getValue(type) {
    if (type === "variable") {
      return new Value("variable", this.value);
    }
    return null;
  }
}

class Device extends Entity {
  constructor(data, zones = []) {
    super(data, zones);
    this.driverId = data.driverId;
    this.class = data.class;
    this.zone = data.zone;
    this.capabilities = data.capabilities || [];
    this.available = data.available;
  }

  get zoneName() {
    if (this.zone && this.zoneMap.has(this.zone)) {
      const zone = this.zoneMap.get(this.zone);
      return zone.name;
    }
    return null;
  }

  toString() {
    return `Device(id: ${this.id}, name: ${this.name}, class: ${this.class}, available: ${this.available})`;
  }

  isAvailable() {
    return this.available;
  }

  hasCapability(capability) {
    return (
      this._rawData.capabilities &&
      this._rawData.capabilities.includes(capability)
    );
  }

  getValue(type) {
    if (this._rawData.capabilitiesObj && this._rawData.capabilitiesObj[type]) {
      const capability = this._rawData.capabilitiesObj[type];
      return new Value(capability.id, capability.value);
    }
    return null;
  }
}

class Zone extends Entity {
  constructor(data) {
    super(data);
    this.parent = data.parent;
    this.icon = data.icon;
  }

  toString() {
    return `Zone(id: ${this.id}, name: ${this.name})`;
  }
}

class Items {
  constructor(entities = [], zones = []) {
    this.items = entities;
    this.zones = zones;
    this.zoneMap = new Map();

    // Create a map for quick zone lookup by ID
    if (zones && zones.length > 0) {
      zones.forEach((zone) => {
        this.zoneMap.set(zone.id, zone);
      });
    }
  }

  add(entity) {
    this.items.push(entity);
  }

  get length() {
    return this.items.length;
  }

  forEach(callback) {
    this.items.forEach(callback);
  }

  slice(start, end) {
    return new Items(this.items.slice(start, end), this.zones);
  }

  filter(callback) {
    return new Items(this.items.filter(callback), this.zones);
  }

  find(callback) {
    return this.items.find(callback);
  }

  getItem(id) {
    return this.items.find((item) => item.id === id);
  }

  print() {
    // Debug: Items count and details
    this.items.forEach((entity) => {
      let output = `- ${entity.id}: ${entity.name}`;

      // Add zone information if entity has a zone and we have zone data
      const zoneId = entity.zone || entity._rawData.zone;
      if (zoneId && this.zoneMap.has(zoneId)) {
        const zone = this.zoneMap.get(zoneId);
        output += ` (Zone: ${zone.name})`;
      }

      // Debug: Entity output
    });
  }

  [Symbol.iterator]() {
    return this.items[Symbol.iterator]();
  }
}

export { Value, Entity, Variable, Device, Zone, Items };
