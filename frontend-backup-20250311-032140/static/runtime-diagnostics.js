// Runtime Diagnostics Module
// This file contains runtime diagnostic tools and error tracking

// Initialize diagnostic state
(function (window) {
    const diagnostics = {
        errors: [],
        warnings: [],
        info: []
    };

    // Runtime error handler
    window.onerror = function (msg, url, lineNo, columnNo, error) {
        diagnostics.errors.push({
            message: msg,
            source: url,
            line: lineNo,
            column: columnNo,
            error: error,
            timestamp: new Date().toISOString()
        });
        console.error('[Runtime Error]', msg, { url, lineNo, columnNo, error });
        return false;
    };

    // Unhandled promise rejection handler
    window.onunhandledrejection = function (event) {
        diagnostics.errors.push({
            type: 'unhandled-promise-rejection',
            reason: event.reason,
            timestamp: new Date().toISOString()
        });
        console.error('[Unhandled Promise Rejection]', event.reason);
    };

    // React error boundary fallback
    window.__REACT_ERROR_OVERLAY__ = {
        handleRuntimeError(error) {
            diagnostics.errors.push({
                type: 'react-runtime-error',
                error: error,
                timestamp: new Date().toISOString()
            });
            console.error('[React Runtime Error]', error);
        }
    };

    // Expose diagnostics API
    window.__RUNTIME_DIAGNOSTICS__ = {
        getErrors: () => [...diagnostics.errors],
        getWarnings: () => [...diagnostics.warnings],
        getInfo: () => [...diagnostics.info],
        clear: () => {
            diagnostics.errors = [];
            diagnostics.warnings = [];
            diagnostics.info = [];
        },
        log: (level, message, data) => {
            diagnostics[level].push({
                message,
                data,
                timestamp: new Date().toISOString()
            });
        }
    };
})(typeof window !== 'undefined' ? window : global);

// Enhanced console logging
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
};

// Wrap console methods
console.log = function (...args) {
    if (window.__RUNTIME_DIAGNOSTICS__.config.enabled) {
        window.__RUNTIME_DIAGNOSTICS__.logs.push({
            type: 'log',
            timestamp: Date.now(),
            args: args
        });

        // Trim logs if needed
        if (window.__RUNTIME_DIAGNOSTICS__.logs.length > window.__RUNTIME_DIAGNOSTICS__.config.maxLogs) {
            window.__RUNTIME_DIAGNOSTICS__.logs.shift();
        }
    }
    originalConsole.log.apply(console, args);
};

console.warn = function (...args) {
    if (window.__RUNTIME_DIAGNOSTICS__.config.enabled) {
        window.__RUNTIME_DIAGNOSTICS__.warnings.push({
            timestamp: Date.now(),
            args: args
        });
    }
    originalConsole.warn.apply(console, args);
};

console.error = function (...args) {
    if (window.__RUNTIME_DIAGNOSTICS__.config.enabled) {
        window.__RUNTIME_DIAGNOSTICS__.errors.push({
            timestamp: Date.now(),
            args: args
        });
    }
    originalConsole.error.apply(console, args);
};

// Performance monitoring
if (window.performance && window.performance.mark) {
    window.__RUNTIME_DIAGNOSTICS__.markPerformance = function (name) {
        window.performance.mark(name);
    };

    window.__RUNTIME_DIAGNOSTICS__.measurePerformance = function (name, startMark, endMark) {
        try {
            window.performance.measure(name, startMark, endMark);
            return window.performance.getEntriesByName(name).pop();
        } catch (e) {
            console.warn('Performance measurement failed:', e);
            return null;
        }
    };
}

// Debug panel functionality
window.__RUNTIME_DIAGNOSTICS__.showDebugPanel = function () {
    let panel = document.getElementById('debug-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'debug-panel';
        document.body.appendChild(panel);
    }
    panel.classList.add('visible');

    // Update panel content
    const updatePanel = () => {
        if (!panel.classList.contains('visible')) return;

        const stats = {
            errors: window.__RUNTIME_DIAGNOSTICS__.errors.length,
            warnings: window.__RUNTIME_DIAGNOSTICS__.warnings.length,
            logs: window.__RUNTIME_DIAGNOSTICS__.logs.length,
            uptime: Math.floor((Date.now() - window.__RUNTIME_DIAGNOSTICS__.startTime) / 1000)
        };

        panel.innerHTML = `
      Runtime Stats:
      Errors: ${stats.errors}
      Warnings: ${stats.warnings}
      Logs: ${stats.logs}
      Uptime: ${stats.uptime}s
    `;
    };

    setInterval(updatePanel, 1000);
};

// Initialize debug panel if in debug mode
if (window.__RUNTIME_DIAGNOSTICS__.config.debugMode) {
    window.__RUNTIME_DIAGNOSTICS__.showDebugPanel();
}

console.log('[Runtime Diagnostics] Successfully initialized runtime diagnostics');
