// Add crypto polyfill
const crypto = require('crypto');

// Add missing getRandomValues function to crypto
if (!crypto.getRandomValues) {
    crypto.getRandomValues = function getRandomValues(array) {
        const bytes = crypto.randomBytes(array.length);
        for (let i = 0; i < bytes.length; i++) {
            array[i] = bytes[i];
        }
        return array;
    };
}

// Monkey patch the global crypto object
global.crypto = crypto;
