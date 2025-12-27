/**
 * 🔥 Codingnplay 서버용 Scratch 프로젝트 저장
 * - 자동저장/수동저장 구분
 * - 썸네일 포함 저장
 * - 세션 쿠키 기반 인증
 * - 🔥 fileId 기반 업데이트 (UserFiles.id 사용)
 */

// 🔥 프로젝트별 fileId 저장소 (projectId → fileId 매핑)
const projectFileIds = {};

/**
 * 🔥 fileId 가져오기
 * @param {string|number} projectId - 프로젝트 식별자
 * @returns {number|null}
 */
export function getFileId(projectId) {
    return projectFileIds[projectId] || null;
}

/**
 * 🔥 fileId 설정하기
 * @param {string|number} projectId - 프로젝트 식별자
 * @param {number} fileId - UserFiles.id
 */
export function setFileId(projectId, fileId) {
    if (projectId && fileId) {
        projectFileIds[projectId] = fileId;
        console.log(`📎 [Scratch] fileId 매핑 저장: projectId=${projectId} → fileId=${fileId}`);
    }
}

/**
 * Save a project JSON to the codingnplay server.
 * @param {number} projectId the ID of the project, null if a new project.
 * @param {object} vmState the JSON project representation.
 * @param {object} params the request params.
 * @return {Promise} A promise that resolves when the network request resolves.
 */
export default function (projectId, vmState, params) {
    const creatingProject = projectId === null || typeof projectId === 'undefined';
    
    // 🔥 saveType 결정: 수동 저장 시 'projects', 자동 저장 시 'autosave'
    const saveType = params.saveType || (params.isAutoSave ? 'autosave' : 'projects');
    
    const requestBody = {
        projectData: vmState,
        title: params.title || 'Untitled',
        thumbnail: params.thumbnailBase64 || null
    };

    // 🔥 업데이트 시 fileId 사용 (UserFiles.id 기반)
    let url;
    let method;
    
    if (creatingProject) {
        url = '/api/scratch/save-project';
        method = 'POST';
    } else {
        // 🔥 기존 프로젝트: fileId로 업데이트
        const fileId = projectFileIds[projectId];
        if (fileId) {
            url = `/api/scratch/save-project/${fileId}`;
            method = 'PUT';
            console.log(`📎 [Scratch] 업데이트 요청: fileId=${fileId} (projectId=${projectId})`);
        } else {
            // fileId가 없으면 새 프로젝트로 생성
            console.warn(`⚠️ [Scratch] fileId 없음, 새 프로젝트로 생성: projectId=${projectId}`);
            url = '/api/scratch/save-project';
            method = 'POST';
        }
    }

    console.log(`💾 [Scratch] 프로젝트 저장 요청: ${method} ${url}, saveType: ${saveType}`);

    return fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 413) {
                return response.json().then(data => {
                    throw new Error(data.message || '저장 공간이 부족합니다.');
                });
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(data.message || 'Project save failed');
        }
        
        const returnedProjectId = data.projectId;
        const returnedFileId = data.fileId;
        
        console.log(`✅ [Scratch] 프로젝트 저장 완료: projectId=${returnedProjectId}, fileId=${returnedFileId}`);
        
        // 🔥 fileId 매핑 저장 (다음 업데이트를 위해)
        if (returnedProjectId && returnedFileId) {
            projectFileIds[returnedProjectId] = returnedFileId;
            console.log(`📎 [Scratch] fileId 매핑 저장됨: ${returnedProjectId} → ${returnedFileId}`);
        }
        
        return {
            id: returnedProjectId,                    // Redux에서 사용하는 projectId
            'content-name': returnedProjectId,
            fileId: returnedFileId,                   // 🔥 UserFiles.id (업데이트용)
            thumbnailUrl: data.thumbnailUrl
        };
    })
    .catch(error => {
        console.error(`❌ [Scratch] 프로젝트 저장 실패:`, error);
        throw error;
    });
}

/**
 * 🔥 프로젝트 삭제 함수
 * @param {string|number} projectId - 삭제할 프로젝트 ID
 * @returns {Promise}
 */
export function deleteProject(projectId) {
    if (!projectId) {
        return Promise.reject(new Error('Project ID is required'));
    }
    
    // 🔥 fileId로 삭제 요청
    const fileId = projectFileIds[projectId];
    if (!fileId) {
        console.warn(`⚠️ [Scratch] 삭제 시 fileId 없음: projectId=${projectId}`);
        return Promise.reject(new Error('File ID not found for this project'));
    }
    
    const url = `/api/scratch/project/${fileId}`;
    console.log(`🗑️ [Scratch] 프로젝트 삭제 요청: ${url}`);
    
    return fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // 🔥 로컬 매핑에서도 제거
            delete projectFileIds[projectId];
            console.log(`✅ [Scratch] 프로젝트 삭제 완료: projectId=${projectId}, fileId=${fileId}`);
        }
        return data;
    })
    .catch(error => {
        console.error(`❌ [Scratch] 프로젝트 삭제 실패:`, error);
        throw error;
    });
}

/**
 * 🔥 프로젝트 로드 시 fileId 설정 (외부에서 호출)
 * 프로젝트 목록에서 프로젝트를 열 때 사용
 * @param {string} projectId - 프로젝트 식별자
 * @param {number} fileId - UserFiles.id
 */
export function registerProjectFileId(projectId, fileId) {
    if (projectId && fileId) {
        projectFileIds[projectId] = fileId;
        console.log(`📎 [Scratch] 프로젝트 로드 시 fileId 등록: ${projectId} → ${fileId}`);
    }
}

/**
 * 🔥 썸네일만 업데이트하는 함수
 */
export function updateProjectThumbnail(projectId, thumbnailBlob) {
    if (!projectId || !thumbnailBlob) {
        return Promise.resolve();
    }

    const fileId = projectFileIds[projectId];
    if (!fileId) {
        console.warn(`⚠️ [Scratch] 썸네일 업데이트 시 fileId 없음: projectId=${projectId}`);
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const thumbnailBase64 = reader.result;
            
            fetch(`/api/scratch/project/${fileId}/thumbnail`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ thumbnailBase64 })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Thumbnail update failed: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`📸 [Scratch] 썸네일 업데이트 완료: fileId=${fileId}`);
                resolve(data);
            })
            .catch(error => {
                console.warn(`⚠️ [Scratch] 썸네일 업데이트 실패:`, error);
                resolve(); // 썸네일 실패는 무시
            });
        };
        reader.onerror = () => resolve();
        reader.readAsDataURL(thumbnailBlob);
    });
}
