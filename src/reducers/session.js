// src/reducers/session.js
const SET_SESSION = 'scratch-gui/session/SET_SESSION';
const CLEAR_SESSION = 'scratch-gui/session/CLEAR_SESSION';
const SET_SESSION_ERROR = 'scratch-gui/session/SET_SESSION_ERROR';

const sessionInitialState = {
    session: {
        user: null
    },
    permissions: {
        educator: false,
        student: false
    },
    status: 'NOT_FETCHED',
    error: null
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = sessionInitialState;
    
    switch (action.type) {
    case SET_SESSION:
        return Object.assign({}, state, {
            session: {
                user: action.user
            },
            permissions: action.permissions || {
                educator: false,
                student: false
            },
            status: 'FETCHED',
            error: null
        });
    case CLEAR_SESSION:
        return Object.assign({}, state, sessionInitialState);
    case SET_SESSION_ERROR:
        return Object.assign({}, state, {
            status: 'ERROR',
            error: action.error
        });
    default:
        return state;
    }
};

// Action Creators (동기 액션만)
const setSession = function (user, permissions) {
    return {
        type: SET_SESSION,
        user: user,
        permissions: permissions
    };
};

const clearSession = function () {
    return {
        type: CLEAR_SESSION
    };
};

const setSessionError = function (error) {
    return {
        type: SET_SESSION_ERROR,
        error: error
    };
};

export {
    reducer as default,
    sessionInitialState,
    setSession,
    clearSession,
    setSessionError
};
