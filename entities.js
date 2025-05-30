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
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this._rawData = data;
  }

  toJSON() {
    return this._rawData;
  }

  toString() {
    return `${this.constructor.name}(id: ${this.id}, name: ${this.name})`;
  }

  print() {
    console.log(JSON.stringify(this._rawData, null, 2));
  }

  hasCapability(capability) {
    return false; // Default implementation
  }

  getValue(type) {
    return null; // Default implementation
  }
}

class Variable extends Entity {
  constructor(data) {
    super(data);
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
  constructor(data) {
    super(data);
    this.driverId = data.driverId;
    this.class = data.class;
    this.zone = data.zone;
    this.capabilities = data.capabilities || [];
    this.available = data.available;
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

class Items {
  constructor(entities = []) {
    this.items = entities;
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
    return new Items(this.items.slice(start, end));
  }

  filter(callback) {
    return new Items(this.items.filter(callback));
  }

  find(callback) {
    return this.items.find(callback);
  }

  getItem(id) {
    return this.items.find((item) => item.id === id);
  }

  print() {
    console.log(`Items (${this.length}):`);
    this.items.forEach((entity) => {
      console.log(`- ${entity.id}: ${entity.name}`);
    });
  }

  [Symbol.iterator]() {
    return this.items[Symbol.iterator]();
  }
}

export { Value, Entity, Variable, Device, Items };
