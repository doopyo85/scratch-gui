/**
 * 서버에서 불러온 프로젝트 정보를 관리하는 reducer
 * 덮어쓰기 저장을 위해 fileId를 추적
 */

const SET_LOADED_PROJECT = 'scratch-gui/loaded-project/SET_LOADED_PROJECT';
const CLEAR_LOADED_PROJECT = 'scratch-gui/loaded-project/CLEAR_LOADED_PROJECT';

const initialState = {
    fileId: null,           // UserFiles 테이블의 ID
    title: null,            // 프로젝트 제목
    loadedAt: null,         // 불러온 시간
    isFromServer: false     // 서버에서 불러온 프로젝트인지 여부
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;

    switch (action.type) {
    case SET_LOADED_PROJECT:
        return Object.assign({}, state, {
            fileId: action.fileId,
            title: action.title,
            loadedAt: new Date().toISOString(),
            isFromServer: true
        });
    case CLEAR_LOADED_PROJECT:
        return Object.assign({}, initialState);
    default:
        return state;
    }
};

// Action creators
const setLoadedProject = (fileId, title) => ({
    type: SET_LOADED_PROJECT,
    fileId: fileId,
    title: title
});

const clearLoadedProject = () => ({
    type: CLEAR_LOADED_PROJECT
});

// Selectors
const getLoadedProjectFileId = state => state.scratchGui.loadedProject.fileId;
const getLoadedProjectTitle = state => state.scratchGui.loadedProject.title;
const getIsFromServer = state => state.scratchGui.loadedProject.isFromServer;

export {
    reducer as default,
    initialState as loadedProjectInitialState,
    setLoadedProject,
    clearLoadedProject,
    getLoadedProjectFileId,
    getLoadedProjectTitle,
    getIsFromServer
};
