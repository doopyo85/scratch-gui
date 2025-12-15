/**
 * Save a project JSON to the codingnplay server.
 * @param {number} projectId the ID of the project, null if a new project.
 * @param {object} vmState the JSON project representation.
 * @param {object} params the request params.
 * @return {Promise} A promise that resolves when the network request resolves.
 */
export default function (projectId, vmState, params) {
    const creatingProject = projectId === null || typeof projectId === 'undefined';
    
    const requestBody = {
        projectId: projectId,
        projectData: vmState,
        title: params.title || 'Untitled',
        isNew: creatingProject,
        isCopy: params.isCopy || false,
        isRemix: params.isRemix || false,
        originalId: params.originalId || null
    };

    const url = creatingProject 
        ? '/api/scratch/save-project'
        : `/api/scratch/save-project/${projectId}`;
    
    const method = creatingProject ? 'POST' : 'PUT';

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
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(data.message || 'Project save failed');
        }
        return {
            id: data.projectId,
            'content-name': data.projectId
        };
    });
}
