export const testAuth = () => {
    console.log('Testing Authentication...');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    return { token, user };
  };

  export const testReduxStore = (store) => {
    console.log('Testing Redux Store State...');
    const state = store.getState();
    return state;
  };
