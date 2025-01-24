// Project Dashboard Functionality
document.addEventListener('DOMContentLoaded', () => {
    initializeProjectDashboard();
});

function initializeProjectDashboard() {
    // Set up any initial listeners or data
    setupMotivationalUpdates();
}

function setupMotivationalUpdates() {
    // Periodically update motivation message
    setInterval(async () => {
        try {
            const response = await fetch('/api/motivation');
            const data = await response.json();
            if (data.message) {
                document.getElementById('motivationText').textContent = data.message;
            }
        } catch (error) {
            console.error('Error updating motivation:', error);
        }
    }, 300000); // Update every 5 minutes
}

async function viewProject(projectId) {
    try {
        const response = await fetch(`/api/projects/${projectId}`);
        const projectData = await response.json();
        // Handle project view logic
        console.log('Project data:', projectData);
        // You could update a modal or navigate to a project detail page
    } catch (error) {
        console.error('Error fetching project:', error);
    }
}

async function createProject() {
    const form = document.getElementById('newProjectForm');
    const projectData = {
        title: document.getElementById('projectTitle').value,
        description: document.getElementById('projectDescription').value,
        category: document.getElementById('projectCategory').value
    };

    try {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });

        if (response.ok) {
            const result = await response.json();
            // Refresh the project list or add the new project to the UI
            location.reload(); // Simple refresh for now
        } else {
            console.error('Failed to create project');
        }
    } catch (error) {
        console.error('Error creating project:', error);
    }
}

function updateProgressBar(projectId, progress) {
    const progressBar = document.querySelector(`#project-${projectId} .progress-bar`);
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
        progressBar.textContent = `${progress}%`;
    }
}
