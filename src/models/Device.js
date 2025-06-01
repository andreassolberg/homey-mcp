import Entity from './Entity.js';
import Value from './Value.js';

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

export default Device;