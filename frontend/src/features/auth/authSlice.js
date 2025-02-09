export const login = createAsyncThunk('auth/login', async credentials => {
  const response = await api.post('/auth/login', credentials);
  // Store the token
  localStorage.setItem('authToken', response.data.token);
  return response.data;
});
