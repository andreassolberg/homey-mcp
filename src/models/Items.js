class Items {
  constructor(entities = [], zones = []) {
    this.items = entities;
    this.zones = zones;
    this.zoneMap = new Map();
    this.idMap = new Map();
    this.nameMap = new Map();

    // Create a map for quick zone lookup by ID
    if (zones && zones.length > 0) {
      zones.forEach((zone) => {
        this.zoneMap.set(zone.id, zone);
      });
    }

    // Create maps for quick entity lookup by ID and name
    this._buildEntityMaps();
  }

  _buildEntityMaps() {
    this.idMap.clear();
    this.nameMap.clear();
    
    this.items.forEach((entity) => {
      if (entity.id) {
        this.idMap.set(entity.id, entity);
      }
      if (entity.name) {
        // Handle potential name collisions by storing arrays
        if (this.nameMap.has(entity.name)) {
          const existing = this.nameMap.get(entity.name);
          if (Array.isArray(existing)) {
            existing.push(entity);
          } else {
            this.nameMap.set(entity.name, [existing, entity]);
          }
        } else {
          this.nameMap.set(entity.name, entity);
        }
      }
    });
  }

  add(entity) {
    this.items.push(entity);
    // Update maps when adding new entity
    if (entity.id) {
      this.idMap.set(entity.id, entity);
    }
    if (entity.name) {
      if (this.nameMap.has(entity.name)) {
        const existing = this.nameMap.get(entity.name);
        if (Array.isArray(existing)) {
          existing.push(entity);
        } else {
          this.nameMap.set(entity.name, [existing, entity]);
        }
      } else {
        this.nameMap.set(entity.name, entity);
      }
    }
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

  getItemById(id) {
    return this.idMap.get(id) || null;
  }

  getItemByName(name) {
    const result = this.nameMap.get(name);
    if (!result) {
      return null;
    }
    // If multiple items have the same name, return the first one
    return Array.isArray(result) ? result[0] : result;
  }

  getItemsByName(name) {
    const result = this.nameMap.get(name);
    if (!result) {
      return [];
    }
    return Array.isArray(result) ? result : [result];
  }

  // Backward compatibility - deprecated, use getItemById instead
  getItem(id) {
    return this.getItemById(id);
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