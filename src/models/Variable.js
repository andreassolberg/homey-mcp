import Entity from './Entity.js';
import Value from './Value.js';

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

export default Variable;