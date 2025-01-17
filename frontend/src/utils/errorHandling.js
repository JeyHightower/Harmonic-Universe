export const handleApiError = (error, defaultMessage) => {
  return error.response?.data?.message || defaultMessage;
};

export const createAsyncThunkHandler = (asyncFn, errorMessage) => {
  return async (args, thunkAPI) => {
    try {
      return await asyncFn(args);
    } catch (error) {
      return thunkAPI.rejectWithValue(handleApiError(error, errorMessage));
    }
  };
};

export const createLoadingReducers = (builder, thunkAction) => {
  builder
    .addCase(thunkAction.pending, state => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(thunkAction.fulfilled, state => {
      state.isLoading = false;
      state.error = null;
    })
    .addCase(thunkAction.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
};
