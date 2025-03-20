// Simple implementation of object spread2 helper
export default function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === 'function') {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function (key) {
            if (key !== '__proto__') {
                Object.defineProperty(target, key, {
                    value: source[key],
                    enumerable: true,
                    configurable: true,
                    writable: true
                });
            }
        });
    }
    return target;
}
