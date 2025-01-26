export const mockUniverses = [
  { id: 1, name: "Test Universe 1" },
  { id: 2, name: "Test Universe 2" },
];

export const mockFetchUniverses = () => async (dispatch) => {
  dispatch({ type: "universe/fetchUniverses/pending" });
  dispatch({
    type: "universe/fetchUniverses/fulfilled",
    payload: mockUniverses,
  });
};

export const mockCreateUniverse = (data) => async (dispatch) => {
  dispatch({ type: "universe/createUniverse/pending" });
  dispatch({
    type: "universe/createUniverse/fulfilled",
    payload: { id: 3, ...data },
  });
};
