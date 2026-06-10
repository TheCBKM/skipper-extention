class EventEmitter {
  listeners = {};

  on(event, callback) {
    if (!this.listeners.hasOwnProperty(event)) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, ...data) {
    if (!this.listeners.hasOwnProperty(event)) {
      return null;
    }

    for (let i = 0; i < this.listeners[event].length; i++) {
      const callback = this.listeners[event][i];
      callback(...data);
    }
  }

  removeListener(event, callbackToRemove) {
    if (!this.listeners.hasOwnProperty(event)) {
      return;
    }

    const listenersArray = this.listeners[event];
    const index = listenersArray.indexOf(callbackToRemove);
    if (index !== -1) {
      // Remove the callback from the listeners array
      listenersArray.splice(index, 1);
    }
  }
}

export const lock = () => {
  let locked = {};
  const ee = new EventEmitter();

  return {
    acquire: (key) =>
      new Promise((resolve) => {
        // If nobody has the lock, take it and resolve immediately
        if (!locked[key]) {
          // Safe because JS doesn't interrupt you on synchronous operations,
          // so no need for compare-and-swap or anything like that.
          locked[key] = true;
          return resolve();
        }

        // Otherwise, wait until somebody releases the lock and try again
        const tryAcquire = (value) => {
          if (!locked[key]) {
            locked[key] = true;
            ee.removeListener(key, tryAcquire);
            return resolve(value);
          }
        };

        ee.on(key, tryAcquire);
      }),

    // If we pass a value, on release this value
    // will be propagated to all the code that's waiting for
    // the lock to release
    release: (key, value) => {
      Reflect.deleteProperty(locked, key);
      setTimeout(() => ee.emit(key, value), 0);
    },
  };
};

export default lock;
