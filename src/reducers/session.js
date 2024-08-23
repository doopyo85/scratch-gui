// src/reducers/session.js
const initialState = {
  user: null
};

const sessionReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_SESSION_DATA':
      return {
        ...state,
        user: action.payload
      };
    default:
      return state;
  }
};

export const setSessionData = (sessionData) => ({
  type: 'SET_SESSION_DATA',
  payload: sessionData
});

export default sessionReducer;
