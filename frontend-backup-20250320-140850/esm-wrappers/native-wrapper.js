// ES Module wrapper for CommonJS native.js
import native from '../node_modules/rollup/dist/native.js';

// Re-export all properties as named exports
export const parse = native.parse || (() => null);
export const parseAsync = native.parseAsync || (() => Promise.resolve(null));
export const getDefaultNativeFactory = native.getDefaultNativeFactory || (() => null);
export const getNativeFactory = native.getNativeFactory || (() => null);
export const xxhashBase16 = native.xxhashBase16 || (() => null);
export const xxhashBase64Url = native.xxhashBase64Url || (() => null);
export const xxhashBase36 = native.xxhashBase36 || (() => null);

// Also export the default
export default native;
