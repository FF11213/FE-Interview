class EventCenter {
  constructor() {
    this.handlers = {};
  }

  subscribe(eventName, handler) {
    this.handlers[eventName] ? this.handlers[eventName].push(handler) : (this.handlers[eventName] = [handler]);
  }

  publish(eventName, ...args) {
    if (!this.handlers[eventName]) return;
    this.handlers[eventName].forEach((handler) => handler(...args));
  }

  unsubscribe(eventName, handler) {
    if (!this.handlers[eventName]) return;
    this.handlers[eventName] = this.handlers[eventName].filter((item) => item !== handler);
  }

  once(eventName, handler) {
    const fn = (...args) => {
      handler(...args);
      this.unsubscribe(eventName, fn);
    };
    this.subscribe(eventName, fn);
  }
}
