// Initial state
export const sessionInitialState = {
    user: null
};

// Reducer
const sessionReducer = (state = sessionInitialState, action) => {
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

// Action creator
export const setSessionData = (sessionData) => ({
    type: 'SET_SESSION_DATA',
    payload: sessionData
});

export default sessionReducer;
