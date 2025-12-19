/**
 * 🔥 Codingnplay 서버용 Scratch 프로젝트 저장
 * - 자동저장/수동저장 구분
 * - 썸네일 포함 저장
 * - 세션 쿠키 기반 인증
 */

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
        thumbnail: params.thumbnailBase64 || null  // 🔥 썸네일 (서버 API와 일치)
    };

    const url = creatingProject 
        ? '/api/scratch/save-project'
        : `/api/scratch/save-project/${projectId}`;
    
    const method = creatingProject ? 'POST' : 'PUT';

    console.log(`💾 [Scratch] 프로젝트 저장 요청: ${method} ${url}, saveType: ${saveType}`);

    return fetch(url, {
        method: method,
        credentials: 'include',  // 세션 쿠키 포함
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            // 용량 초과 에러 처리
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
        console.log(`✅ [Scratch] 프로젝트 저장 완료: ID ${data.projectId}`);
        return {
            id: data.projectId,
            'content-name': data.projectId,
            thumbnailUrl: data.thumbnailUrl
        };
    })
    .catch(error => {
        console.error(`❌ [Scratch] 프로젝트 저장 실패:`, error);
        throw error;
    });
}

/**
 * 🔥 썸네일만 업데이트하는 함수
 */
export function updateProjectThumbnail(projectId, thumbnailBlob) {
    if (!projectId || !thumbnailBlob) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const thumbnailBase64 = reader.result;
            
            fetch(`/api/scratch/project/${projectId}/thumbnail`, {
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
                console.log(`📸 [Scratch] 썸네일 업데이트 완료`);
                resolve(data);
            })
            .catch(error => {
                console.warn(`⚠️ [Scratch] 썸네일 업데이트 실패:`, error);
                resolve(); // 썸네일 실패는 무시
            });
        };
        reader.onerror = () => resolve(); // 실패해도 무시
        reader.readAsDataURL(thumbnailBlob);
    });
}
