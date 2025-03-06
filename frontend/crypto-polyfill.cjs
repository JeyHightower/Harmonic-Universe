// Add crypto polyfill
const crypto = require('crypto');

if (!globalThis.crypto) {
    globalThis.crypto = {};
}

if (!globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues = function getRandomValues(array) {
        const bytes = crypto.randomBytes(array.length);
        array.set(new Uint8Array(bytes));
        return array;
    };
}
