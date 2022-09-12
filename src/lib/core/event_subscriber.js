/**
 * Describe an event subscriber.
 */
class EventSubscriber {
  /**
   * Constructor
   * @param {any} emitter - The event emitter.
   * @param {string} type - The event type.
   * @param {any} listener - The event listener.
   * @param {boolean} once - If true, subscriber will be deleted after the first event fired.
   * @param {function] cb - Event handler callback function.
   */
  constructor(emitter, type, listener, once, cb) {
    this.emitter = emitter;
    this.type = type;
    this.listener = listener;
    this.once = once;
    this.cb = cb;
  }
}

module.exports.EventSubscriber = EventSubscriber;
