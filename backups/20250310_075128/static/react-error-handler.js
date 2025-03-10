/**
 * React Error Handler
 *
 * This script helps decode minified React errors in production by:
 * 1. Adding a global error handler to catch React errors
 * 2. Providing a function to decode error codes via the React error decoder
 * 3. Adding helpful debugging information to the page when errors occur
 */

(function () {
    // Store original console.error
    const originalConsoleError = console.error;

    // Regex to match minified React error pattern
    const minifiedReactErrorRegex = /Error: (Minified React error #[0-9]+)/;

    // Function to decode React error codes
    async function decodeReactError(errorCode) {
        try {
            const errorNumber = errorCode.match(/#([0-9]+)/)[1];
            const url = `https://reactjs.org/docs/error-decoder.html?invariant=${errorNumber}`;

            // Add a visible error message to the page
            addErrorMessageToPage(errorCode, url);

            console.log(`React error code ${errorNumber} - Visit ${url} for full error details`);

            // Try to fetch the decoded error (will only work if cors allows)
            try {
                const response = await fetch(`https://react.dev/errors/${errorNumber}`);
                if (response.ok) {
                    const text = await response.text();
                    const errorMatch = text.match(/<p>([^<]+)<\/p>/);
                    if (errorMatch && errorMatch[1]) {
                        console.log("Decoded error:", errorMatch[1]);
                        return errorMatch[1];
                    }
                }
            } catch (e) {
                // Ignore fetch errors - we'll still show the link
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    // Function to add error message to page
    function addErrorMessageToPage(errorCode, url) {
        // Create error container if it doesn't exist
        let errorContainer = document.getElementById('react-error-container');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'react-error-container';
            errorContainer.style.position = 'fixed';
            errorContainer.style.top = '0';
            errorContainer.style.left = '0';
            errorContainer.style.right = '0';
            errorContainer.style.backgroundColor = '#f44336';
            errorContainer.style.color = 'white';
            errorContainer.style.padding = '10px';
            errorContainer.style.textAlign = 'center';
            errorContainer.style.zIndex = '9999';
            errorContainer.style.fontFamily = 'Arial, sans-serif';
            document.body.prepend(errorContainer);
        }

        errorContainer.innerHTML = `
      <p style="margin: 5px 0;">
        ${errorCode} -
        <a href="${url}" target="_blank" style="color: white; text-decoration: underline;">
          Click here to see full error details
        </a>
        <button onclick="location.reload()" style="margin-left: 10px; padding: 5px; cursor: pointer;">
          Reload Page
        </button>
      </p>
    `;
    }

    // Provide app debugging info
    function provideDebuggingInfo() {
        const debugInfo = {
            url: window.location.href,
            userAgent: navigator.userAgent,
            date: new Date().toString(),
            scripts: Array.from(document.scripts).map(s => s.src),
            styles: Array.from(document.styleSheets).map(s => s.href)
        };

        console.table(debugInfo);
        return debugInfo;
    }

    // Override console.error to catch React errors
    console.error = function (...args) {
        // Call original console.error
        originalConsoleError.apply(console, args);

        // Look for minified React errors in the arguments
        for (const arg of args) {
            if (typeof arg === 'string' && minifiedReactErrorRegex.test(arg)) {
                const match = arg.match(minifiedReactErrorRegex);
                if (match && match[1]) {
                    decodeReactError(match[1]);
                    provideDebuggingInfo();
                }
            } else if (arg instanceof Error && arg.message && minifiedReactErrorRegex.test(arg.message)) {
                const match = arg.message.match(minifiedReactErrorRegex);
                if (match && match[1]) {
                    decodeReactError(match[1]);
                    provideDebuggingInfo();
                }
            }
        }
    };

    // Add global error handler
    window.addEventListener('error', function (event) {
        if (event.error && event.error.message && minifiedReactErrorRegex.test(event.error.message)) {
            const match = event.error.message.match(minifiedReactErrorRegex);
            if (match && match[1]) {
                decodeReactError(match[1]);
                provideDebuggingInfo();
            }
        }
    });

    // Add unhandled rejection handler
    window.addEventListener('unhandledrejection', function (event) {
        if (event.reason && event.reason.message && minifiedReactErrorRegex.test(event.reason.message)) {
            const match = event.reason.message.match(minifiedReactErrorRegex);
            if (match && match[1]) {
                decodeReactError(match[1]);
                provideDebuggingInfo();
            }
        }
    });

    console.log('[React Error Handler] Initialized');
})();
