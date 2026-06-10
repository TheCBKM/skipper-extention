const IS_PRODUCTION = true;

export function createLogger(namespace) {
  const prefix = `[Skipper:${namespace}]`;
  const noop = () => {};

  return {
    debug: IS_PRODUCTION ? noop : (...args) => console.debug(prefix, ...args),
    info: IS_PRODUCTION ? noop : (...args) => console.info(prefix, ...args),
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
  };
}
