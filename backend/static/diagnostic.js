// Diagnostic tool for Harmonic Universe
document.addEventListener('DOMContentLoaded', function () {
  const root = document.getElementById('root');

  // Create diagnostic container
  const diagnosticDiv = document.createElement('div');
  diagnosticDiv.style.fontFamily = 'monospace';
  diagnosticDiv.style.padding = '20px';
  diagnosticDiv.style.maxWidth = '800px';
  diagnosticDiv.style.margin = '0 auto';
  diagnosticDiv.style.backgroundColor = '#f5f5f5';
  diagnosticDiv.style.border = '1px solid #ddd';
  diagnosticDiv.style.borderRadius = '5px';

  // Add heading
  const heading = document.createElement('h1');
  heading.textContent = 'Harmonic Universe Diagnostics';
  diagnosticDiv.appendChild(heading);

  // Add environment info
  const envInfo = document.createElement('div');
  envInfo.innerHTML = `
    <h2>Environment</h2>
    <ul>
      <li>URL: ${window.location.href}</li>
      <li>React Loaded: ${!!window.React}</li>
      <li>ReactDOM Loaded: ${!!window.ReactDOM}</li>
      <li>Root Element: ${!!root}</li>
      <li>User Agent: ${navigator.userAgent}</li>
    </ul>
  `;
  diagnosticDiv.appendChild(envInfo);

  // Add API test section
  const apiSection = document.createElement('div');
  apiSection.innerHTML = `
    <h2>API Tests</h2>
    <div id="api-results">Running API tests...</div>
  `;
  diagnosticDiv.appendChild(apiSection);

  // Add the diagnostic div to the page
  if (root) {
    root.appendChild(diagnosticDiv);
  } else {
    document.body.appendChild(diagnosticDiv);
  }

  // Run API tests
  const apiEndpoints = [
    '/api/health',
    '/api/debug/whitenoise',
    '/api/debug/mime-test'
  ];

  const apiResults = document.getElementById('api-results');
  apiResults.innerHTML = '';

  apiEndpoints.forEach(endpoint => {
    const resultItem = document.createElement('div');
    resultItem.innerHTML = `Testing ${endpoint}: <span id="result-${endpoint.replace(/\//g, '-')}">Loading...</span>`;
    apiResults.appendChild(resultItem);

    fetch(endpoint)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        document.getElementById(`result-${endpoint.replace(/\//g, '-')}`).innerHTML =
          `<span style="color: green;">SUCCESS</span> <pre>${JSON.stringify(data, null, 2)}</pre>`;
      })
      .catch(error => {
        document.getElementById(`result-${endpoint.replace(/\//g, '-')}`).innerHTML =
          `<span style="color: red;">FAILED</span> ${error.message}`;
      });
  });
}); 