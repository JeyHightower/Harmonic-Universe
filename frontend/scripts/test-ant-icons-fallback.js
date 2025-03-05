#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define the output directory and file paths
const distDir = path.resolve(__dirname, '../../dist');
const fallbackPath = path.join(distDir, 'ant-icons-fallback.js');
const testHtmlPath = path.join(distDir, 'test-fallback.html');

// Create the test HTML content
const testHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ant Icons Fallback Test</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      color: #1890ff;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .test-container {
      background-color: #f5f5f5;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      padding: 20px;
      margin: 20px 0;
    }
    .icon-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 20px;
    }
    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: white;
      padding: 10px;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      width: 100px;
    }
    .icon-item span {
      font-size: 24px;
      margin-bottom: 5px;
    }
    .icon-name {
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .success {
      color: #52c41a;
      font-weight: bold;
    }
    .error {
      color: #f5222d;
      font-weight: bold;
    }
    button {
      background-color: #1890ff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-right: 10px;
    }
    button:hover {
      background-color: #40a9ff;
    }
    pre {
      background-color: #f0f0f0;
      padding: 10px;
      border-radius: 4px;
      overflow: auto;
      max-height: 200px;
    }
  </style>
</head>
<body>
  <h1>Ant Design Icons Fallback Test</h1>

  <div class="test-container">
    <h2>Test Controls</h2>
    <p>Use these buttons to test the fallback mechanism:</p>
    <button id="load-original">Load Original Icons</button>
    <button id="load-fallback">Load Fallback Icons</button>
    <button id="simulate-error">Simulate Error</button>
    <button id="clear-icons">Clear Icons</button>
  </div>

  <div class="test-container">
    <h2>Status</h2>
    <div id="status">Ready to test</div>
    <pre id="log"></pre>
  </div>

  <div class="test-container">
    <h2>Icon Display</h2>
    <p>The icons below should render correctly with both the original and fallback implementations:</p>
    <div class="icon-container" id="icon-container"></div>
  </div>

  <script>
    // Log function
    function log(message) {
      const logEl = document.getElementById('log');
      logEl.textContent += message + '\\n';
      logEl.scrollTop = logEl.scrollHeight;
    }

    // Set status
    function setStatus(message, isError = false) {
      const statusEl = document.getElementById('status');
      statusEl.textContent = message;
      statusEl.className = isError ? 'error' : 'success';
    }

    // Clear icons
    function clearIcons() {
      document.getElementById('icon-container').innerHTML = '';
      window.AntDesignIcons = undefined;
      window.antIconsLoaded = false;
      setStatus('Icons cleared');
      log('Icons cleared');
    }

    // Display icons
    function displayIcons() {
      if (!window.AntDesignIcons) {
        setStatus('No icons available', true);
        return;
      }

      const container = document.getElementById('icon-container');
      container.innerHTML = '';

      // Get all icon names
      const iconNames = Object.keys(window.AntDesignIcons).filter(key =>
        typeof window.AntDesignIcons[key] === 'function' &&
        key !== 'IconProvider' &&
        key !== 'createFromIconfontCN'
      );

      // Display first 20 icons
      const iconsToShow = iconNames.slice(0, 20);

      iconsToShow.forEach(iconName => {
        try {
          const IconComponent = window.AntDesignIcons[iconName];
          const iconElement = IconComponent();

          const iconItem = document.createElement('div');
          iconItem.className = 'icon-item';

          // Convert the React element to a DOM element
          const iconSpan = document.createElement('span');
          iconSpan.className = iconElement.props.className || '';
          iconSpan.style.cssText = Object.entries(iconElement.props.style || {})
            .map(([key, value]) => \`\${key}: \${value}\`)
            .join('; ');

          // Create SVG element
          const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const svgProps = iconElement.props.children[0].props;

          svgEl.setAttribute('viewBox', svgProps.viewBox);
          svgEl.setAttribute('focusable', svgProps.focusable);
          svgEl.setAttribute('data-icon', svgProps['data-icon']);
          svgEl.setAttribute('width', svgProps.width);
          svgEl.setAttribute('height', svgProps.height);
          svgEl.setAttribute('fill', svgProps.fill);
          svgEl.setAttribute('aria-hidden', svgProps['aria-hidden']);

          // Create path element
          const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const pathProps = svgProps.children.props;
          pathEl.setAttribute('d', pathProps.d);

          svgEl.appendChild(pathEl);
          iconSpan.appendChild(svgEl);

          iconItem.appendChild(iconSpan);

          const nameEl = document.createElement('div');
          nameEl.className = 'icon-name';
          nameEl.textContent = iconName;
          iconItem.appendChild(nameEl);

          container.appendChild(iconItem);
        } catch (e) {
          log(\`Error rendering icon \${iconName}: \${e.message}\`);
        }
      });

      setStatus(\`Displayed \${iconsToShow.length} icons using \${window.antIconsLoaded ? 'fallback' : 'original'} implementation\`);
      log(\`Displayed \${iconsToShow.length} icons\`);
    }

    // Load original icons
    function loadOriginalIcons() {
      clearIcons();

      const script = document.createElement('script');
      script.src = '/ant-icons.js';
      script.onload = () => {
        setStatus('Original icons loaded successfully');
        log('Original icons loaded');
        displayIcons();
      };
      script.onerror = (e) => {
        setStatus('Failed to load original icons', true);
        log('Failed to load original icons: ' + e.message);
        loadFallbackIcons();
      };
      document.head.appendChild(script);
    }

    // Load fallback icons
    function loadFallbackIcons() {
      clearIcons();

      const script = document.createElement('script');
      script.src = '/ant-icons-fallback.js';
      script.onload = () => {
        setStatus('Fallback icons loaded successfully');
        log('Fallback icons loaded');
        displayIcons();
      };
      script.onerror = (e) => {
        setStatus('Failed to load fallback icons', true);
        log('Failed to load fallback icons: ' + e.message);
      };
      document.head.appendChild(script);
    }

    // Simulate error
    function simulateError() {
      clearIcons();

      const script = document.createElement('script');
      script.src = '/non-existent-file.js';
      script.onerror = () => {
        log('Simulated error loading icons');
        loadFallbackIcons();
      };
      document.head.appendChild(script);
    }

    // Add event listeners
    document.getElementById('load-original').addEventListener('click', loadOriginalIcons);
    document.getElementById('load-fallback').addEventListener('click', loadFallbackIcons);
    document.getElementById('simulate-error').addEventListener('click', simulateError);
    document.getElementById('clear-icons').addEventListener('click', clearIcons);

    // Initial log
    log('Test page loaded');
  </script>
</body>
</html>
`;

// Ensure the dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Write the test HTML to the output file
fs.writeFileSync(testHtmlPath, testHtml);

console.log(`Ant Design icons fallback test page generated at: ${testHtmlPath}`);

// Run the generate-ant-icons-fallback.js script to create the fallback script
require('./generate-ant-icons-fallback.js');

console.log('Test setup complete. Open the test page in your browser to verify the fallback mechanism.');
