
// Fallback JSX runtime implementation
export function jsx(type, props, key) {
  const element = { type, props, key };
  return element;
}

export function jsxs(type, props, key) {
  return jsx(type, props, key);
}

export const Fragment = Symbol('Fragment');
export default { jsx, jsxs, Fragment };
