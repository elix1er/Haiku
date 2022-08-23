/**
 * The ECSComponent is an abstract class for data-driven component.
 */
class ECSComponent {
  /**
   * Constructor
   * @param {string} typename - A common way to identify a component.
   */
  constructor(typename) {
    this.typename = typename;
  }
}

module.exports.ECSComponent = ECSComponent;
