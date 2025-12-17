import bindAll from 'lodash.bindall';
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import VM from 'scratch-vm';

import MyProjectsModalComponent from '../components/my-projects-modal/my-projects-modal.jsx';
import {closeMyProjectsModal} from '../reducers/modals';
import {setLoadedProject} from '../reducers/loaded-project';

class MyProjectsModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClose',
            'handleLoadProject',
            'handleDeleteProject',
            'handleRefresh',
            'fetchProjects'
        ]);
        this.state = {
            projects: [],
            isLoading: false,
            error: null
        };
    }

    componentDidMount () {
        this.fetchProjects();
    }

    async fetchProjects () {
        this.setState({ isLoading: true, error: null });

        try {
            const response = await fetch('/api/scratch/projects', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('프로젝트 목록을 불러올 수 없습니다.');
            }

            const data = await response.json();
            
            if (data.success) {
                this.setState({
                    projects: data.projects || [],
                    isLoading: false
                });
            } else {
                throw new Error(data.message || '알 수 없는 오류');
            }
        } catch (error) {
            console.error('프로젝트 목록 조회 오류:', error);
            this.setState({
                error: error.message,
                isLoading: false
            });
        }
    }

    handleClose () {
        this.props.onClose();
    }

    async handleLoadProject (project) {
        try {
            // 프로젝트 URL 가져오기
            const response = await fetch(`/api/scratch/project/${project.fileId}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('프로젝트를 불러올 수 없습니다.');
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || '알 수 없는 오류');
            }

            // S3 URL에서 프로젝트 데이터 가져오기
            const projectResponse = await fetch(data.url);
            if (!projectResponse.ok) {
                throw new Error('프로젝트 파일을 다운로드할 수 없습니다.');
            }

            const projectData = await projectResponse.arrayBuffer();
            
            // VM에 프로젝트 로드
            await this.props.vm.loadProject(projectData);
            
            // Redux에 불러온 프로젝트 정보 저장 (덮어쓰기 저장용)
            this.props.onSetLoadedProject(project.fileId, project.title);
            
            alert(`"${project.title}" 프로젝트를 불러왔습니다!`);
            this.handleClose();
            
        } catch (error) {
            console.error('프로젝트 불러오기 오류:', error);
            alert('프로젝트 불러오기 실패: ' + error.message);
        }
    }

    async handleDeleteProject (project) {
        if (!confirm(`"${project.title}" 프로젝트를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/scratch/project/${project.fileId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('프로젝트를 삭제할 수 없습니다.');
            }

            const data = await response.json();
            
            if (data.success) {
                // 목록에서 삭제된 프로젝트 제거
                this.setState(prevState => ({
                    projects: prevState.projects.filter(p => p.fileId !== project.fileId)
                }));
                alert('프로젝트가 삭제되었습니다.');
            } else {
                throw new Error(data.message || '알 수 없는 오류');
            }
        } catch (error) {
            console.error('프로젝트 삭제 오류:', error);
            alert('프로젝트 삭제 실패: ' + error.message);
        }
    }

    handleRefresh () {
        this.fetchProjects();
    }

    render () {
        return (
            <MyProjectsModalComponent
                projects={this.state.projects}
                isLoading={this.state.isLoading}
                error={this.state.error}
                onClose={this.handleClose}
                onLoadProject={this.handleLoadProject}
                onDeleteProject={this.handleDeleteProject}
                onRefresh={this.handleRefresh}
            />
        );
    }
}

MyProjectsModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeMyProjectsModal()),
    onSetLoadedProject: (fileId, title) => dispatch(setLoadedProject(fileId, title))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MyProjectsModal);
