class SceneNode {
  constructor() {
    this.tags = [];
    this.visible = true;
  }

  update(ts) {
    // virtual method called during update phase !
  }

  draw() {
    // virtual method called during draw phase !
  }

  addTag(tag) {
    this.tags.push(tag);
  }

  removeTag(tag) {
    this.tags.splice(this.tags.indexOf(tag), 1);
  }

  hasTag(tag) {
    return this.tags.includes(tag);
  }

  clearTags() {
    this.tags = [];
  }

  isVisible() {
    return this.visible;
  }

  setVisible(visible) {
    this.visible = visible;
  }
}

module.exports.SceneNode = SceneNode;