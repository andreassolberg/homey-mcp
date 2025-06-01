import Entity from './Entity.js';

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

export default Zone;