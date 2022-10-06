interface EventSubscriber {
  emitter: any;
  type: string;
  listener: any;
  once: boolean;
  cb: Function;
};

class EventManager {
  subscribers: Array<EventSubscriber>;

  constructor() {
    this.subscribers = [];
  }

  wait(emitter: any, type: string): Promise<any> {
    return new Promise(resolve => {
      this.subscribeOnce(emitter, type, this, (data: any) => {
        resolve(data);
      });
    });
  }

  subscribe(emitter: any, type: string, listener: any, cb: Function): void {
    this.subscribers.push({ emitter: emitter, type: type, listener: listener, once: false, cb: cb });
  }

  subscribeOnce(emitter: any, type: string, listener: any, cb: Function): void {
    this.subscribers.push({ emitter: emitter, type: type, listener: listener, once: true, cb: cb });
  }

  unsubscribe(emitter: any, type: string, listener: any): void {
    for (let subscriber of this.subscribers) {
      if (subscriber.emitter == emitter && subscriber.type == type && subscriber.listener == listener) {
        this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
        return;
      }
    }
  }

  unsubscribeAll(): void {
    this.subscribers = [];
  }

  async emit(emitter: any, type: string, data: any = {}): Promise<any> {
    const promises: Array<Promise<any>> = [];

    for (const subscriber of this.subscribers.slice()) {
      if (subscriber.emitter == emitter && subscriber.type == type) {
        const res = subscriber.cb.call(subscriber.listener, data);
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

export const eventManager = new EventManager();