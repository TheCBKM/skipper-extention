class EventEmitter {
  listeners = {};

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, ...data) {
    if (!this.listeners[event]) return;
    for (const callback of this.listeners[event]) {
      callback(...data);
    }
  }

  removeListener(event, callbackToRemove) {
    if (!this.listeners[event]) return;
    const index = this.listeners[event].indexOf(callbackToRemove);
    if (index !== -1) {
      this.listeners[event].splice(index, 1);
    }
  }
}

export const lock = () => {
  const locked = {};
  const ee = new EventEmitter();

  return {
    acquire: (key) =>
      new Promise((resolve) => {
        if (!locked[key]) {
          locked[key] = true;
          return resolve();
        }

        const tryAcquire = (value) => {
          if (!locked[key]) {
            locked[key] = true;
            ee.removeListener(key, tryAcquire);
            return resolve(value);
          }
        };

        ee.on(key, tryAcquire);
      }),

    release: (key, value) => {
      delete locked[key];
      setTimeout(() => ee.emit(key, value), 0);
    },
  };
};

export default lock;
