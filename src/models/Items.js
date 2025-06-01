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

export default Items;