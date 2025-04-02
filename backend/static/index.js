// Direct index.js for Harmonic Universe
console.log('Direct index.js loaded successfully');

// Check if React and ReactDOM are already loaded
if (!window.React) {
  console.error('React not found in window object!');
}

if (!window.ReactDOM) {
  console.error('ReactDOM not found in window object!');
}

// Simple App component to test rendering
class App extends window.React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      error: null,
      data: null
    };
  }

  componentDidMount() {
    // Check API health
    fetch('/api/health')
      .then(response => {
        if (!response.ok) {
          throw new Error(`API health check failed: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        this.setState({ loading: false, data });
      })
      .catch(error => {
        console.error('Error fetching API health:', error);
        this.setState({ loading: false, error: error.message });
      });
  }

  render() {
    const { loading, error, data } = this.state;

    return window.React.createElement('div', {
      style: {
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#f7f9fc',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }
    }, [
      window.React.createElement('h1', { key: 'title' }, 'Harmonic Universe'),
      window.React.createElement('p', { key: 'description' },
        'This is a simple React component rendered directly from index.js'),

      loading ?
        window.React.createElement('p', { key: 'loading' }, 'Loading API status...') :
        error ?
          window.React.createElement('div', { key: 'error', style: { color: 'red' } }, [
            window.React.createElement('h3', { key: 'error-title' }, 'Error:'),
            window.React.createElement('p', { key: 'error-message' }, error)
          ]) :
          window.React.createElement('div', { key: 'success' }, [
            window.React.createElement('h3', { key: 'success-title' }, 'API Status: OK'),
            window.React.createElement('pre', { key: 'success-data' },
              JSON.stringify(data, null, 2))
          ])
    ]);
  }
}

// Render your React application
const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('Root element found, rendering React app');
  window.ReactDOM.createRoot(rootElement).render(
    window.React.createElement(App)
  );
} else {
  console.error('Root element not found! Make sure your HTML has a div with id="root"');
} 