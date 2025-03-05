// Ensure Ant Design Icons version is always available
(function () {
    if (typeof window !== 'undefined') {
        window.__ANT_ICONS_VERSION__ = window.__ANT_ICONS_VERSION__ || '4.2.1';

        // Add a getter to the window object for any component trying to access the version
        Object.defineProperty(window, '__getAntIconsVersion', {
            value: function () {
                return window.__ANT_ICONS_VERSION__;
            },
            writable: false
        });
    }
})();
