import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  parameters: {
    tempo: 120,
    key: 'C',
    scale: 'major',
    harmony: 'triad',
    dynamics: 0.8,
  },
  isLoading: false,
  error: null,
};

const musicSlice = createSlice({
  name: 'music',
  initialState,
  reducers: {
    setParameters: (state, action) => {
      state.parameters = action.payload;
    },
    updateParameter: (state, action) => {
      const { parameter, value } = action.payload;
      state.parameters[parameter] = value;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setParameters, updateParameter, setLoading, setError } =
  musicSlice.actions;

export default musicSlice.reducer;
