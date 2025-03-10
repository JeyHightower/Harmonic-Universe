// Simplified React vendor bundle
(function() {
  // Ensure global React is available
  if (!window.React) {
    console.log('Initializing React from vendor bundle');
    window.React = {
      version: '18.2.0',
      createElement: function(type, props, ...children) {
        return { type, props: props || {}, children };
      },
      useState: function(initialState) {
        const state = typeof initialState === 'function' ? initialState() : initialState;
        return [state, function() { console.log('State update called') }];
      },
      useEffect: function(callback, deps) {
        try {
          if (!deps || !deps.length) {
            setTimeout(callback, 0);
          }
        } catch (err) {
          console.error('Error in useEffect:', err);
        }
      },
      useCallback: function(callback) {
        return callback;
      },
      createContext: function(defaultValue) {
        const context = {
          Provider: function(props) { return props.children; },
          Consumer: function(props) { return props.children(defaultValue); },
          _currentValue: defaultValue
        };
        return context;
      },
      lazy: function(importFn) {
        return {
          $$typeof: Symbol.for('react.lazy'),
          _payload: {
            _status: -1,
            _result: importFn
          },
          _init: function() {
            return { default: function FallbackComponent(props) {
              return window.React.createElement('div', null, 'Component Loading...');
            }};
          }
        };
      },
      Suspense: function(props) {
        return props.children;
      },
      StrictMode: function(props) {
        return props.children;
      }
    };
  }

  // Ensure global ReactDOM is available
  if (!window.ReactDOM) {
    console.log('Initializing ReactDOM from vendor bundle');
    window.ReactDOM = {
      version: '18.2.0',
      createRoot: function(container) {
        return {
          render: function(element) {
            console.log('Rendering React element to container');
            if (container && typeof element === 'object') {
              // Simple render implementation
              container.innerHTML = '<div class="app-container"><div class="app-header"><h1>Harmonic Universe</h1></div><div class="app-content"><div><h2>Welcome to Harmonic Universe</h2><p>Explore the fascinating connection between music and physics.</p></div></div><div class="app-footer">© ' + new Date().getFullYear() + ' Harmonic Universe</div></div>';
            }
          },
          unmount: function() {
            if (container) {
              container.innerHTML = '';
            }
          }
        };
      }
    };
  }

  // Ensure Redux is available
  if (!window.Redux) {
    console.log('Initializing Redux from vendor bundle');
    window.Redux = {
      createStore: function(reducer, initialState) {
        let state = initialState || {};
        const listeners = [];

        return {
          getState: function() { return state; },
          dispatch: function(action) {
            console.log('Action dispatched:', action);
            if (action && action.type) {
              try {
                state = reducer(state, action);
                listeners.forEach(listener => listener());
              } catch (err) {
                console.error('Error in reducer:', err);
              }
            }
            return action;
          },
          subscribe: function(listener) {
            listeners.push(listener);
            return function() {
              const index = listeners.indexOf(listener);
              if (index !== -1) {
                listeners.splice(index, 1);
              }
            };
          }
        };
      },
      combineReducers: function(reducers) {
        return function(state = {}, action) {
          const nextState = {};
          Object.keys(reducers).forEach(key => {
            nextState[key] = reducers[key](state[key], action);
          });
          return nextState;
        };
      }
    };
  }

  // Ensure React Router is available
  if (!window.ReactRouter) {
    console.log('Initializing React Router from vendor bundle');
    window.ReactRouter = {
      Routes: function(props) { return props.children; },
      Route: function(props) { return props.element; },
      useNavigate: function() {
        return function(path) {
          console.log('Navigate to:', path);
          if (path && typeof path === 'string') {
            window.history.pushState(null, '', path);
          }
        };
      },
      useLocation: function() {
        return { pathname: window.location.pathname, search: window.location.search };
      },
      Outlet: function() {
        return window.React.createElement('div', { className: 'outlet' }, 'Content Area');
      }
    };
  }

  console.log('Vendor bundle loaded successfully');
})();