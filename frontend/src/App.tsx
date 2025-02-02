import { CssBaseline, ThemeProvider } from '@mui/material';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes } from 'react-router-dom';
import { store } from './store';
import theme from './styles/theme';

// Import your components here
// Example: import Home from './pages/Home';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Add your routes here */}
            {/* Example: <Route path="/" element={<Home />} /> */}
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
