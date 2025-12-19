import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {FormattedMessage, FormattedDate} from 'react-intl';
import Modal from '../../containers/modal.jsx';
import styles from './my-projects-modal.css';

const MyProjectsModal = ({
    projects,
    isLoading,
    error,
    onClose,
    onLoadProject,
    onDeleteProject,
    onRefresh
}) => (
    <Modal
        className={styles.modalContent}
        contentLabel="내 프로젝트"
        id="myProjectsModal"
        onRequestClose={onClose}
    >
        <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
                <FormattedMessage
                    defaultMessage="내 프로젝트"
                    description="Title for my projects modal"
                    id="gui.myProjects.title"
                />
            </h2>
            <button
                className={styles.refreshButton}
                onClick={onRefresh}
                title="새로고침"
            >
                <i className={styles.refreshIcon}>↻</i>
            </button>
        </div>

        <div className={styles.modalBody}>
            {isLoading && (
                <div className={styles.loadingWrapper}>
                    <div className={styles.loadingSpinner} />
                    <p>프로젝트를 불러오는 중...</p>
                </div>
            )}

            {error && (
                <div className={styles.errorWrapper}>
                    <p className={styles.errorText}>{error}</p>
                    <button
                        className={styles.retryButton}
                        onClick={onRefresh}
                    >
                        다시 시도
                    </button>
                </div>
            )}

            {!isLoading && !error && projects.length === 0 && (
                <div className={styles.emptyWrapper}>
                    <div className={styles.emptyIcon}>📁</div>
                    <p className={styles.emptyText}>저장된 프로젝트가 없습니다.</p>
                    <p className={styles.emptySubtext}>새 프로젝트를 만들어 저장해보세요!</p>
                </div>
            )}

            {!isLoading && !error && projects.length > 0 && (
                <div className={styles.projectGrid}>
                    {projects.map(project => (
                        <div
                            key={project.fileId}
                            className={styles.projectCard}
                        >
                            <div className={styles.projectThumbnail}>
                                {project.thumbnailUrl ? (
                                    <img 
                                        src={project.thumbnailUrl} 
                                        alt={project.title || '프로젝트 썸네일'}
                                        className={styles.thumbnailImage}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div 
                                    className={styles.thumbnailPlaceholder}
                                    style={{ display: project.thumbnailUrl ? 'none' : 'flex' }}
                                >
                                    🐱
                                </div>
                            </div>
                            <div className={styles.projectInfo}>
                                <h3 className={styles.projectTitle}>
                                    {project.title || '제목 없음'}
                                </h3>
                                <p className={styles.projectDate}>
                                    {new Date(project.createdAt).toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                                <p className={styles.projectSize}>
                                    {formatFileSize(project.size)}
                                </p>
                            </div>
                            <div className={styles.projectActions}>
                                <button
                                    className={classNames(styles.actionButton, styles.loadButton)}
                                    onClick={() => onLoadProject(project)}
                                    title="불러오기"
                                >
                                    열기
                                </button>
                                <button
                                    className={classNames(styles.actionButton, styles.deleteButton)}
                                    onClick={() => onDeleteProject(project)}
                                    title="삭제"
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className={styles.modalFooter}>
            <button
                className={styles.closeButton}
                onClick={onClose}
            >
                닫기
            </button>
        </div>
    </Modal>
);

// 파일 크기 포맷 함수
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

MyProjectsModal.propTypes = {
    projects: PropTypes.arrayOf(PropTypes.shape({
        fileId: PropTypes.number.isRequired,
        title: PropTypes.string,
        size: PropTypes.number,
        createdAt: PropTypes.string,
        thumbnailUrl: PropTypes.string
    })),
    isLoading: PropTypes.bool,
    error: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    onLoadProject: PropTypes.func.isRequired,
    onDeleteProject: PropTypes.func.isRequired,
    onRefresh: PropTypes.func.isRequired
};

MyProjectsModal.defaultProps = {
    projects: [],
    isLoading: false,
    error: null
};

export default MyProjectsModal;
