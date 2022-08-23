let { EventSubscriber } = require('./event_subscriber');

/**
 * Manager to handle events.
 */
class EventManager {
  constructor() {
    this.subscribers = [];
  }

  /**
   * Wait an event fired.
   * @param {any} emitter - The emitter.
   * @param {string} type - The event type.
   * @return {Promise} Promise containing event data.
   */
  wait(emitter, type) {
    return new Promise(resolve => {
      this.subscribeOnce(emitter, type, this, (data) => {
        resolve(data);
      });
    });
  }

  /**
   * Add a subscriber.
   * @param {any} emitter - The emitter.
   * @param {string} type - The event type.
   * @param {any} listener - The listener.
   * @param {function} cb - The callback called when event is fired by emitter. Important note: The context is bind to listener at exec.
   */
  subscribe(emitter, type, listener, cb) {
    if (!emitter) {
      throw new Error('EventManager::subscribe(): emitter is undefined !');
    }
    if (!type) {
      throw new Error('EventManager::subscribe(): type is undefined !');
    }
    if (!cb || typeof cb != 'function') {
      throw new Error('EventManager::subscribe(): cb is not a function !');
    }

    this.subscribers.push(new EventSubscriber(emitter, type, listener, false, cb));
  }

  /**
   * Add a subscriber. This subscriber is deleted after an event fired.
   * @param {any} emitter - The emitter.
   * @param {string} type - The event type.
   * @param {any} listener - The listener.
   * @param {function} cb - The callback called when event is fired by emitter. Important note: The context is bind to listener at exec.
   */
  subscribeOnce(emitter, type, listener, cb) {
    if (!emitter) {
      throw new Error('EventManager::subscribe(): emitter is undefined !');
    }
    if (!type) {
      throw new Error('EventManager::subscribe(): type is undefined !');
    }
    if (!cb || typeof cb != 'function') {
      throw new Error('EventManager::subscribe(): cb is not a function !');
    }

    this.subscribers.push(new EventSubscriber(emitter, type, listener, true, cb));
  }

  /**
   * Remove a subscriber.
   * @param {any} emitter - The emitter.
   * @param {string} type - The event type.
   * @param {any} listener - The listener.
   */
  unsubscribe(emitter, type, listener) {
    for (let subscriber of this.subscribers) {
      if (subscriber.emitter == emitter && subscriber.type == type && subscriber.listener == listener) {
        this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
        return;
      }
    }
  }

  /**
   * Remove all subscribers.
   */
  unsubscribeAll() {
    this.subscribers = [];
  }

  /**
   * Fire an event.
   * @param {any} emitter - The emitter.
   * @param {string} type - The event type.
   * @param {any} data - Data payload.
   * @return {Promise} - Return a promise resolved when all listeners have finished.
   */
  async emit(emitter, type, data) {
    let promises = [];

    for (let subscriber of this.subscribers.slice()) {
      if (subscriber.emitter == emitter && subscriber.type == type) {
        let res = subscriber.cb.call(subscriber.listener, data);
        if (res instanceof Promise) {
          promises.push(res);
        }
  
        if (subscriber.once) {
          this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
        }
      }
    }

    return Promise.all(promises);
  }
}

module.exports.eventManager = new EventManager();
