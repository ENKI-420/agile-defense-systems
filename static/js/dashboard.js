// Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

function initializeDashboard() {
    setupTabNavigation();
    loadProjects();
    setupCollaborationFeatures();
    setupVoiceChat();
    setupGestureGuide();
}

function setupTabNavigation() {
    // Handle tab switching animations
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', (e) => {
            const targetId = e.target.getAttribute('data-bs-target');
            const targetPane = document.querySelector(targetId);
            targetPane.classList.add('tab-animation');
            setTimeout(() => targetPane.classList.remove('tab-animation'), 300);
        });
    });
}

function loadProjects() {
    fetch('/api/projects')
        .then(response => response.json())
        .then(projects => {
            const projectsList = document.getElementById('projectsList');
            if (projectsList) {
                projectsList.innerHTML = projects.map(project => `
                    <div class="project-card mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">${project.title}</h5>
                                <p class="card-text">${project.description}</p>
                                <div class="progress mb-3" style="height: 10px;">
                                    <div class="progress-bar bg-info" 
                                         role="progressbar" 
                                         style="width: ${project.progress}%">
                                    </div>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-secondary">${project.category}</span>
                                    <button class="btn btn-sm btn-outline-primary">View Details</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        })
        .catch(error => console.error('Error loading projects:', error));
}

function setupCollaborationFeatures() {
    const socket = io();
    
    // Handle real-time collaboration updates
    socket.on('user_joined', (data) => {
        updateCollaboratorsList(data.users);
    });

    socket.on('user_left', (data) => {
        updateCollaboratorsList(data.users);
    });
}

function updateCollaboratorsList(users) {
    const collaboratorsList = document.getElementById('collaboratorsList');
    if (collaboratorsList) {
        collaboratorsList.innerHTML = users.map(user => `
            <div class="collaborator-badge d-inline-block m-1">
                <span class="badge bg-secondary">
                    <i class="bi bi-person-fill"></i> ${user.name}
                </span>
            </div>
        `).join('');
    }
}

function setupVoiceChat() {
    // Initialize voice chat features if available
    if ('webkitSpeechRecognition' in window) {
        const voiceChatInterface = document.getElementById('voiceChatInterface');
        if (voiceChatInterface) {
            voiceChatInterface.innerHTML = `
                <div class="text-center">
                    <button class="btn btn-lg btn-outline-primary mb-3" id="voiceChatToggle">
                        <i class="bi bi-mic"></i> Start Voice Chat
                    </button>
                    <div id="voiceStatus" class="text-muted"></div>
                </div>
            `;
        }
    } else {
        // Show fallback message for unsupported browsers
        const voiceChatInterface = document.getElementById('voiceChatInterface');
        if (voiceChatInterface) {
            voiceChatInterface.innerHTML = `
                <div class="alert alert-info">
                    Voice chat is not supported in your browser. 
                    Please use Chrome or Edge for voice features.
                </div>
            `;
        }
    }
}

function setupGestureGuide() {
    const gestureGuide = document.getElementById('gestureGuide');
    if (gestureGuide) {
        gestureGuide.innerHTML = `
            <div class="gesture-tutorial">
                <div class="mb-4">
                    <h6>Available Gestures</h6>
                    <div class="gesture-demo d-flex justify-content-around">
                        <div class="gesture-item">
                            <div class="gesture-arrow">→</div>
                            <p>Swipe Right</p>
                        </div>
                        <div class="gesture-item">
                            <div class="gesture-arrow">←</div>
                            <p>Swipe Left</p>
                        </div>
                        <div class="gesture-item">
                            <div class="gesture-arrow">↑</div>
                            <p>Swipe Up</p>
                        </div>
                    </div>
                </div>
                <div class="gesture-settings">
                    <button class="btn btn-primary" onclick="CommandWizard.init()">
                        <i class="bi bi-gear"></i> Customize Gestures
                    </button>
                </div>
            </div>
        `;
    }
}
