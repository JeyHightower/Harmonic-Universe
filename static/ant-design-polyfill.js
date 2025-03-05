// Polyfill for Ant Design Icons version
(function () {
    console.log("Applying Ant Design Icons polyfill");

    // Set global version property
    window.__ANT_ICONS_VERSION__ = "4.2.1";

    // Create version object on window
    window.AntDesignIconsVersion = {
        version: "4.2.1"
    };

    // Patch utils.js version access
    const originalGetProperty = Object.getOwnPropertyDescriptor(Object.prototype, "version");

    // Create a safe version getter
    Object.defineProperty(Object.prototype, "version", {
        get: function () {
            if (this === undefined || this === null) {
                console.warn("Attempted to access version on undefined/null, returning fallback");
                return "4.2.1";
            }
            return originalGetProperty ? originalGetProperty.get.call(this) : undefined;
        },
        configurable: true
    });

    // Clean up after 5 seconds to avoid memory leaks
    setTimeout(function () {
        if (originalGetProperty) {
            Object.defineProperty(Object.prototype, "version", originalGetProperty);
        } else {
            delete Object.prototype.version;
        }
        console.log("Removed temporary version property patch");
    }, 5000);
})();
