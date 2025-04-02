// diagnostic.js - Script for troubleshooting Harmonic Universe app

// Configuration
const config = {
  appName: 'Harmonic Universe',
  debug: true,
  checkTimeout: 5000,
  checkInterval: 1000,
  maxRetries: 5
};

// Diagnostic tools
class DiagnosticTools {
  constructor() {
    this.results = [];
    this.errors = [];
    this.init();
  }

  init() {
    console.log(`[${config.appName} Diagnostics] Initializing...`);
    this.logSystemInfo();
  }

  logSystemInfo() {
    const info = {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      screen: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      performance: this.getPerformanceMetrics()
    };

    console.log(`[${config.appName} Diagnostics] System Information:`, info);
    return info;
  }

  getPerformanceMetrics() {
    if (!window.performance) return null;

    return {
      navigationStart: performance.timing ? performance.timing.navigationStart : null,
      loadTime: performance.timing ? (performance.timing.loadEventEnd - performance.timing.navigationStart) : null,
      resources: this.getResourceMetrics()
    };
  }

  getResourceMetrics() {
    if (!window.performance || !performance.getEntriesByType) return [];

    return performance.getEntriesByType('resource').map(resource => ({
      name: resource.name,
      type: resource.initiatorType,
      duration: Math.round(resource.duration),
      size: resource.transferSize || 0
    }));
  }

  checkNetworkConnections() {
    const endpoints = [
      '/api/health',
      '/index.html',
      '/assets/index.js',
      '/static/index.js'
    ];

    console.log(`[${config.appName} Diagnostics] Checking network connections...`);

    const checks = endpoints.map(endpoint =>
      fetch(endpoint, { method: 'HEAD' })
        .then(response => ({
          url: endpoint,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        }))
        .catch(error => ({
          url: endpoint,
          error: error.message,
          ok: false
        }))
    );

    return Promise.all(checks).then(results => {
      console.log(`[${config.appName} Diagnostics] Network check results:`, results);
      return results;
    });
  }

  checkDOMStructure() {
    const rootElement = document.getElementById('root');
    const result = {
      rootExists: !!rootElement,
      rootEmpty: rootElement ? !rootElement.hasChildNodes() : true,
      bodyChildCount: document.body.childNodes.length,
      scripts: Array.from(document.scripts).map(s => s.src).filter(Boolean),
      styles: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(s => s.href).filter(Boolean)
    };

    console.log(`[${config.appName} Diagnostics] DOM structure:`, result);
    return result;
  }

  checkLocalStorage() {
    try {
      const testKey = `${config.appName.toLowerCase()}-test`;
      localStorage.setItem(testKey, 'test');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      return {
        available: true,
        working: value === 'test'
      };
    } catch (e) {
      return {
        available: false,
        error: e.message
      };
    }
  }

  monitorConsoleErrors() {
    const originalError = console.error;
    const diagnostics = this;

    console.error = function () {
      const errorMessage = Array.from(arguments).join(' ');
      diagnostics.errors.push({
        message: errorMessage,
        timestamp: new Date().toISOString()
      });

      originalError.apply(console, arguments);
    };

    window.addEventListener('error', (event) => {
      diagnostics.errors.push({
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: new Date().toISOString()
      });
    });
  }

  runAllChecks() {
    return Promise.all([
      this.checkNetworkConnections(),
      Promise.resolve(this.checkDOMStructure()),
      Promise.resolve(this.checkLocalStorage())
    ]).then(([networkResults, domResults, storageResults]) => {
      const fullResults = {
        timestamp: new Date().toISOString(),
        systemInfo: this.logSystemInfo(),
        network: networkResults,
        dom: domResults,
        storage: storageResults,
        errors: this.errors
      };

      this.results.push(fullResults);
      console.log(`[${config.appName} Diagnostics] All checks completed:`, fullResults);
      return fullResults;
    });
  }

  injectVisualDebugTools() {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.backgroundColor = 'rgba(0,0,0,0.8)';
    container.style.color = '#0f0';
    container.style.padding = '10px';
    container.style.borderRadius = '5px';
    container.style.maxWidth = '300px';
    container.style.maxHeight = '200px';
    container.style.overflow = 'auto';
    container.style.zIndex = '9999';
    container.style.fontSize = '12px';
    container.style.fontFamily = 'monospace';

    const title = document.createElement('div');
    title.textContent = `${config.appName} Diagnostics`;
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '5px';
    title.style.borderBottom = '1px solid #0f0';

    const content = document.createElement('div');
    content.id = 'diagnostic-content';

    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh';
    refreshButton.style.backgroundColor = '#0f0';
    refreshButton.style.color = '#000';
    refreshButton.style.border = 'none';
    refreshButton.style.padding = '2px 5px';
    refreshButton.style.marginTop = '5px';
    refreshButton.style.cursor = 'pointer';
    refreshButton.onclick = () => this.updateVisualDebug();

    container.appendChild(title);
    container.appendChild(content);
    container.appendChild(refreshButton);

    document.body.appendChild(container);
    this.updateVisualDebug();
  }

  updateVisualDebug() {
    const content = document.getElementById('diagnostic-content');
    if (!content) return;

    // Simple status check
    const rootElement = document.getElementById('root');
    const apiAvailable = this.results.length > 0 &&
      this.results[this.results.length - 1].network.some(n => n.url === '/api/health' && n.ok);

    content.innerHTML = `
      <div>App State: ${rootElement && !rootElement.innerHTML.includes('Loading') ? 'Loaded' : 'Not Loaded'}</div>
      <div>API: ${apiAvailable ? 'Available' : 'Unavailable'}</div>
      <div>Errors: ${this.errors.length}</div>
      <div>Last Check: ${new Date().toLocaleTimeString()}</div>
    `;
  }
}

// Initialize diagnostics
const diagnostics = new DiagnosticTools();
diagnostics.monitorConsoleErrors();

// Run checks when document is ready
window.addEventListener('DOMContentLoaded', () => {
  console.log(`[${config.appName} Diagnostics] Document loaded, running checks...`);

  // Run initial checks
  diagnostics.runAllChecks().then(() => {
    // Add visual debug tools
    if (config.debug) {
      diagnostics.injectVisualDebugTools();
    }

    // Set up periodic checking
    let retries = 0;
    const checkInterval = setInterval(() => {
      const rootElement = document.getElementById('root');

      if (rootElement && rootElement.childNodes.length > 0 &&
        !rootElement.innerHTML.includes('Loading')) {
        // App seems to be loaded
        console.log(`[${config.appName} Diagnostics] Application appears to be loaded`);
        clearInterval(checkInterval);

        // Final check
        setTimeout(() => diagnostics.runAllChecks(), 1000);
      } else if (retries >= config.maxRetries) {
        // Max retries reached
        console.log(`[${config.appName} Diagnostics] Application failed to load after ${config.maxRetries} checks`);
        clearInterval(checkInterval);

        // Add troubleshooting UI
        const rootEl = document.getElementById('root');
        if (rootEl) {
          rootEl.innerHTML = `
            <div style="text-align: center; padding: 20px; font-family: sans-serif; color: #333;">
              <h2>${config.appName} - Troubleshooting</h2>
              <p>The application is not loading properly. Here are some possible reasons:</p>
              <ul style="text-align: left; max-width: 500px; margin: 0 auto;">
                <li>JavaScript files failed to load</li>
                <li>API connection issues</li>
                <li>Application error during initialization</li>
              </ul>
              <p>Check the browser console for more details.</p>
              <button onclick="window.location.reload()">Reload Page</button>
              <button onclick="localStorage.clear(); window.location.reload()">Clear Storage & Reload</button>
            </div>
          `;
        }

        // Final diagnostic run
        diagnostics.runAllChecks();
      } else {
        // Keep checking
        retries++;
        console.log(`[${config.appName} Diagnostics] Check ${retries}/${config.maxRetries}: Application not loaded yet`);

        // Run checks again
        diagnostics.runAllChecks();
      }
    }, config.checkInterval);
  });
}); 