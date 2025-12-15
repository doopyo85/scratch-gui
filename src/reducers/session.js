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
    status: 'NOT_FETCHED', // NOT_FETCHED, FETCHING, FETCHED, ERROR
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

// Action Creators
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

// 3000번 서버에서 세션 정보 가져오기
const fetchSession = function () {
    return function (dispatch) {
        // 상대 경로 사용 (같은 도메인이므로 Apache 프록시 경유)
        return fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include', // 세션 쿠키 포함
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Session fetch failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.loggedIn && data.user) {
                dispatch(setSession({
                    username: data.user.userID,
                    id: data.user.id,
                    thumbnailUrl: data.user.profileImage || '/resource/profiles/default.webp',
                    classroomId: data.user.centerID
                }, {
                    educator: data.user.role === 'teacher' || data.user.role === 'admin' || data.user.role === 'manager',
                    student: data.user.role === 'student'
                }));
            } else {
                dispatch(clearSession());
            }
        })
        .catch(error => {
            console.error('Session fetch error:', error);
            dispatch(setSessionError(error.message));
        });
    };
};

// 로그아웃
const logout = function () {
    return function (dispatch) {
        return fetch('/logout', {
            method: 'GET',
            credentials: 'include'
        })
        .then(() => {
            dispatch(clearSession());
            // 메인 페이지로 리다이렉트
            window.location.href = '/auth/login';
        })
        .catch(error => {
            console.error('Logout error:', error);
        });
    };
};

export {
    reducer as default,
    sessionInitialState,
    setSession,
    clearSession,
    setSessionError,
    fetchSession,
    logout
};
