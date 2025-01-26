export const memoize = (func) => {
  const cache = new Map();

  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
};

export const memoizeWithTTL = (func, ttl = 5000) => {
  const cache = new Map();

  return (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < ttl) {
      return cached.value;
    }

    const result = func(...args);
    cache.set(key, { value: result, timestamp: now });
    return result;
  };
};

export const createSelector = (...funcs) => {
  const resultFunc = funcs.pop();
  const dependencies = funcs;
  let lastArgs = null;
  let lastResult = null;

  return (...args) => {
    const currentArgs = dependencies.map((dep) => dep(...args));

    if (
      lastArgs &&
      currentArgs.length === lastArgs.length &&
      currentArgs.every((arg, index) => arg === lastArgs[index])
    ) {
      return lastResult;
    }

    lastArgs = currentArgs;
    lastResult = resultFunc(...currentArgs);
    return lastResult;
  };
};

export const shallowEqual = (objA, objB) => {
  if (objA === objB) {
    return true;
  }

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
      objA[keysA[i]] !== objB[keysA[i]]
    ) {
      return false;
    }
  }

  return true;
};
