import React from 'react';
import PropTypes from 'prop-types';
import {intlShape, injectIntl} from 'react-intl';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import queryString from 'query-string';

// 🔥 fileId 매핑을 위한 import
import { setFileId } from './save-project-to-server';
import {setProjectUnchanged} from '../reducers/project-changed';
import {
    LoadingStates,
    getIsCreatingNew,
    getIsFetchingWithId,
    getIsLoading,
    getIsShowingProject,
    onFetchedProjectData,
    projectError,
    setProjectId
} from '../reducers/project-state';
import {
    activateTab,
    BLOCKS_TAB_INDEX
} from '../reducers/editor-tab';

import { setSession } from '../reducers/session';

import log from './log';
import storage from './storage';

const ProjectFetcherHOC = function (WrappedComponent) {
    class ProjectFetcherComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'fetchProject',
                'fetchSessionData'
            ]);
            storage.setProjectHost(props.projectHost);
            storage.setProjectToken(props.projectToken);
            storage.setAssetHost(props.assetHost);
            storage.setTranslatorFunction(props.intl.formatMessage);
            if (
                props.projectId !== '' &&
                props.projectId !== null &&
                typeof props.projectId !== 'undefined'
            ) {
                this.props.setProjectId(props.projectId.toString());
            }
        }
        
         fetchSessionData() {
            // 쿠키에서 토큰 찾기
            const cookieToken = window.document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
        
            if (cookieToken) {
                try {
                    const decodedToken = jwtDecode(cookieToken);
                    console.log('Decoded cookie token:', decodedToken);
                    if (this.props.onSetSessionData) {
                        this.props.onSetSessionData(decodedToken);
                    } else {
                        console.warn('onSetSessionData is not provided as a prop');
                    }
                } catch (error) {
                    console.error('Failed to decode cookie token:', error);
                    this.fetchSessionFromServer();
                }
            } else {
                console.log('No token found in cookie');
                this.fetchSessionFromServer();
            }
        }
        
        fetchSessionFromServer() {
            window.fetch('https://codingnplay.site/get-user-session', {
                credentials: 'include'
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Server responded with status: ' + res.status);
                }
                return res.json();
            })
            .then(sessionData => {
                console.log('Session data:', sessionData);
                if (this.props.onSetSessionData) {
                    this.props.onSetSessionData(sessionData);
                } else {
                    console.warn('onSetSessionData is not provided as a prop');
                }
            })
            .catch(err => {
                console.error('Failed to fetch session data:', err);
                // 여기에 에러 처리 로직 추가 (예: 로그인 페이지로 리다이렉트)
            });
        }
        
        componentDidMount() {
            const urlHash = window.location.hash;
            
            // 🔥 URL 파라미터에서 fileId 추출 및 등록
            this.registerFileIdFromUrl();
            
            if (urlHash.startsWith('#http')) {
                const projectUrl = urlHash.substring(1);
                this.fetchProject(null, this.props.loadingState);
            }
        }
        
        /**
         * 🔥 URL 파라미터에서 fileId를 추출하여 매핑 등록
         * URL 형식: /scratch/?fileId=123&projectId=xxx#https://s3...scratch.sb3
         */
        registerFileIdFromUrl() {
            try {
                const queryParams = queryString.parse(window.location.search);
                const fileId = queryParams.fileId;
                const projectId = queryParams.projectId || this.props.projectId;
                
                if (fileId && projectId) {
                    setFileId(projectId, parseInt(fileId, 10));
                    console.log(`📎 [Scratch] URL에서 fileId 등록: projectId=${projectId}, fileId=${fileId}`);
                } else if (fileId) {
                    // projectId가 없으면 해시에서 추출 시도
                    const urlHash = window.location.hash;
                    if (urlHash.startsWith('#http')) {
                        // S3 URL에서 projectId 추출 (예: scratch_1735123456789.sb3)
                        const match = urlHash.match(/scratch_([\d]+)\.sb3/);
                        if (match) {
                            const extractedProjectId = match[1];
                            setFileId(extractedProjectId, parseInt(fileId, 10));
                            console.log(`📎 [Scratch] URL 해시에서 projectId 추출 후 fileId 등록: projectId=${extractedProjectId}, fileId=${fileId}`);
                        }
                    }
                }
            } catch (error) {
                console.warn('⚠️ [Scratch] URL에서 fileId 추출 실패:', error);
            }
        }

        componentDidUpdate(prevProps) {
            if (prevProps.projectHost !== this.props.projectHost) {
                storage.setProjectHost(this.props.projectHost);
            }
            if (prevProps.projectToken !== this.props.projectToken) {
                storage.setProjectToken(this.props.projectToken);
            }
            if (prevProps.assetHost !== this.props.assetHost) {
                storage.setAssetHost(this.props.assetHost);
            }
            if (this.props.isFetchingWithId && !prevProps.isFetchingWithId) {
                this.fetchProject(this.props.reduxProjectId, this.props.loadingState);
            }
            if (this.props.isShowingProject && !prevProps.isShowingProject) {
                this.props.onProjectUnchanged();
            }
            if (this.props.isShowingProject && (prevProps.isLoadingProject || prevProps.isCreatingNew)) {
                this.props.onActivateTab(BLOCKS_TAB_INDEX);
            }
        }
        fetchProject(projectId, loadingState) {
            const urlHash = window.location.hash;
            console.log('URL Hash:', urlHash);
        
            if (urlHash.startsWith('#http') || (projectId === null && urlHash.startsWith('#http'))) {
                const projectUrl = urlHash.substring(1); 
                console.log('Loading project from URL:', projectUrl);
            fetch(projectUrl, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Origin': 'https://codingnplay.site'
                }
            })
                .then(response => {
                    console.log('Response status:', response.status);
                    console.log('Response headers:', response.headers);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => {
                    console.log('ArrayBuffer size:', arrayBuffer.byteLength);
                    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                        throw new Error('Received empty project data');
                    }
                    console.log('Project arrayBuffer loaded');
                    return this.props.vm.loadProject(arrayBuffer);
                })
                .then(() => {
                    console.log(`Project loaded from ${projectUrl}`);
                    this.props.onFetchedProjectData(arrayBuffer, loadingState);
                })
                .catch(error => {
                    console.error(`Error loading project from ${projectUrl}:`, error);
                    this.props.onError(error);
                });
            } else {
                // 기존의 프로젝트 로딩 로직
                storage
                    .load(storage.AssetType.Project, projectId, storage.DataFormat.JSON)
                    .then(projectAsset => {
                        if (projectAsset) {
                            this.props.onFetchedProjectData(projectAsset.data, loadingState);
                        } else {
                            throw new Error('Could not find project');
                        }
                    })
                    .catch(err => {
                        this.props.onError(err);
                        log.error(err);
                    });
            }
        }

        render() {
            const {
                /* eslint-disable no-unused-vars */
                assetHost,
                intl,
                isLoadingProject: isLoadingProjectProp,
                loadingState,
                onActivateTab,
                onError: onErrorProp,
                onFetchedProjectData: onFetchedProjectDataProp,
                onProjectUnchanged,
                projectHost,
                projectId,
                reduxProjectId,
                setProjectId: setProjectIdProp,
                /* eslint-enable no-unused-vars */
                isFetchingWithId: isFetchingWithIdProp,
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    fetchingProject={isFetchingWithIdProp}
                    {...componentProps}
                />
            );
        }
    }

    ProjectFetcherComponent.propTypes = {
        assetHost: PropTypes.string,
        canSave: PropTypes.bool,
        intl: intlShape.isRequired,
        isCreatingNew: PropTypes.bool,
        isFetchingWithId: PropTypes.bool,
        isLoadingProject: PropTypes.bool,
        isShowingProject: PropTypes.bool,
        loadingState: PropTypes.oneOf(LoadingStates),
        onActivateTab: PropTypes.func,
        onError: PropTypes.func,
        onFetchedProjectData: PropTypes.func,
        onProjectUnchanged: PropTypes.func,
        onSetSessionData: PropTypes.func,
        projectHost: PropTypes.string,
        projectToken: PropTypes.string,
        projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        reduxProjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        setProjectId: PropTypes.func,
        vm: PropTypes.shape({
            loadProject: PropTypes.func
        })
    };

    ProjectFetcherComponent.defaultProps = {
        assetHost: 'https://assets.scratch.mit.edu',
        projectHost: 'https://projects.scratch.mit.edu'
    };

    const mapStateToProps = state => ({
        isCreatingNew: getIsCreatingNew(state.scratchGui.projectState.loadingState),
        isFetchingWithId: getIsFetchingWithId(state.scratchGui.projectState.loadingState),
        isLoadingProject: getIsLoading(state.scratchGui.projectState.loadingState),
        isShowingProject: getIsShowingProject(state.scratchGui.projectState.loadingState),
        loadingState: state.scratchGui.projectState.loadingState,
        reduxProjectId: state.scratchGui.projectState.projectId
    });

    const mapDispatchToProps = dispatch => ({
        onActivateTab: tab => dispatch(activateTab(tab)),
        onError: error => dispatch(projectError(error)),
        onFetchedProjectData: (projectData, loadingState) =>
            dispatch(onFetchedProjectData(projectData, loadingState)),
        onSetSessionData: data => dispatch(setSession(data)),
        setProjectId: projectId => dispatch(setProjectId(projectId)),
        onProjectUnchanged: () => dispatch(setProjectUnchanged())
    });

    return injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps
    )(ProjectFetcherComponent));
};

export default ProjectFetcherHOC;
