class Value {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }

  toString() {
    return `Value(type: ${this.type}, value: ${this.value})`;
  }
}

export default Value;