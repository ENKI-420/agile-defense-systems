// Command Customization Wizard
const CommandWizard = {
    defaultCommands: {
        swipeRight: 'view projects',
        swipeLeft: 'new project',
        swipeUp: 'show motivation'
    },

    // User's custom command mappings and context
    customCommands: {},
    currentContext: 'default',
    collaborators: new Set(),

    // Initialize wizard with enhanced context support
    init() {
        this.loadCustomCommands();
        this.createWizardUI();
        this.setupContextualListeners();
        this.initializeSocketConnection();
    },

    // Load saved command preferences with context
    loadCustomCommands() {
        const saved = localStorage.getItem('customCommands');
        if (saved) {
            this.customCommands = JSON.parse(saved);
        } else {
            this.customCommands = {
                default: {...this.defaultCommands},
                project: {
                    swipeRight: 'next milestone',
                    swipeLeft: 'previous milestone',
                    swipeUp: 'project overview'
                },
                chat: {
                    swipeRight: 'next message',
                    swipeLeft: 'quick reply',
                    swipeUp: 'show context'
                }
            };
            this.saveCustomCommands();
        }
    },

    // Setup contextual awareness
    setupContextualListeners() {
        // Listen for view changes
        document.addEventListener('click', (e) => {
            if (e.target.closest('.project-card')) {
                this.setContext('project');
            } else if (e.target.closest('.chat-messages')) {
                this.setContext('chat');
            } else {
                this.setContext('default');
            }
        });
    },

    // Initialize real-time collaboration
    initializeSocketConnection() {
        const socket = io();

        socket.on('user_joined_workspace', (data) => {
            this.collaborators.add(data.userId);
            this.updateCollaboratorUI();
        });

        socket.on('user_left_workspace', (data) => {
            this.collaborators.delete(data.userId);
            this.updateCollaboratorUI();
        });

        socket.on('command_executed', (data) => {
            this.handleCollaboratorCommand(data);
        });
    },

    // Update command context
    setContext(newContext) {
        this.currentContext = newContext;
        this.updateCommandFeedback();
        // Emit context change to collaborators
        if (socket) {
            socket.emit('context_changed', { context: newContext });
        }
    },

    // Create enhanced wizard UI
    createWizardUI() {
        const wizard = document.createElement('div');
        wizard.className = 'command-wizard modal fade';
        wizard.id = 'commandWizard';
        wizard.setAttribute('tabindex', '-1');

        const contextualCommands = {
            default: ['View Projects', 'New Project', 'Show Motivation'],
            project: ['Next Milestone', 'Previous Milestone', 'Project Overview'],
            chat: ['Next Message', 'Quick Reply', 'Show Context']
        };

        wizard.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-dark">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-gear-fill me-2"></i>
                            Customize Touch Commands
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="tutorial-section mb-4">
                            <h6>
                                <i class="bi bi-info-circle me-2"></i>
                                Context-Aware Commands
                            </h6>
                            <p>Commands adapt based on your current view:</p>
                            <div class="context-indicators mb-3">
                                <span class="badge bg-primary me-2">Default</span>
                                <span class="badge bg-info me-2">Project</span>
                                <span class="badge bg-success">Chat</span>
                            </div>
                            <div class="collaborators-section mb-3">
                                <h6>Active Collaborators</h6>
                                <div id="collaboratorsList" class="d-flex flex-wrap gap-2">
                                </div>
                            </div>
                            <div class="gesture-demo">
                                <div class="gesture-arrow">→</div>
                                <div class="gesture-arrow">←</div>
                                <div class="gesture-arrow">↑</div>
                            </div>
                        </div>
                        <form id="commandForm">
                            ${Object.keys(contextualCommands).map(context => `
                                <div class="command-context-section" data-context="${context}">
                                    <h6 class="mb-3">${context.charAt(0).toUpperCase() + context.slice(1)} Context</h6>
                                    ${['Right', 'Left', 'Up'].map(direction => `
                                        <div class="mb-3">
                                            <label class="form-label">
                                                <i class="bi bi-arrow-${direction.toLowerCase()} me-2"></i>
                                                Swipe ${direction}
                                            </label>
                                            <select class="form-select" id="${context}Swipe${direction}">
                                                ${contextualCommands[context].map(cmd => 
                                                    `<option value="${cmd.toLowerCase().replace(' ', '_')}">${cmd}</option>`
                                                ).join('')}
                                            </select>
                                        </div>
                                    `).join('')}
                                </div>
                            `).join('')}
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="CommandWizard.savePreferences()">
                            <i class="bi bi-check-circle me-2"></i>Save Preferences
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(wizard);

        // Add settings button next to the command button
        const settingsButton = document.createElement('button');
        settingsButton.className = 'btn btn-secondary command-settings-btn';
        settingsButton.innerHTML = '<i class="bi bi-gear"></i>';
        settingsButton.title = 'Customize Commands';
        settingsButton.setAttribute('data-bs-toggle', 'modal');
        settingsButton.setAttribute('data-bs-target', '#commandWizard');
        document.body.appendChild(settingsButton);
    },

    // Update collaborator UI
    updateCollaboratorUI() {
        const list = document.getElementById('collaboratorsList');
        if (list) {
            list.innerHTML = Array.from(this.collaborators).map(userId => `
                <span class="badge bg-secondary">
                    <i class="bi bi-person-fill me-1"></i>${userId}
                </span>
            `).join('');
        }
    },

    // Handle collaborator commands
    handleCollaboratorCommand(data) {
        VoiceCommands.updateFeedbackStatus(`${data.userId} executed: ${data.command}`);
        setTimeout(() => VoiceCommands.updateFeedbackStatus(''), 2000);
    },

    // Save user preferences with context
    savePreferences() {
        Object.keys(this.customCommands).forEach(context => {
            this.customCommands[context] = {
                swipeRight: document.getElementById(`${context}SwipeRight`).value,
                swipeLeft: document.getElementById(`${context}SwipeLeft`).value,
                swipeUp: document.getElementById(`${context}SwipeUp`).value
            };
        });

        this.saveCustomCommands();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('commandWizard'));
        modal.hide();

        // Show success message
        VoiceCommands.updateFeedbackStatus('Command preferences saved!');
        setTimeout(() => VoiceCommands.updateFeedbackStatus(''), 2000);

        // Notify collaborators
        if (socket) {
            socket.emit('preferences_updated', { commands: this.customCommands });
        }
    },

    // Get contextual command for gesture
    getCommandForGesture(gesture) {
        return this.customCommands[this.currentContext]?.[gesture] 
            || this.customCommands.default[gesture] 
            || this.defaultCommands[gesture];
    },

    // Save command preferences
    saveCustomCommands() {
        localStorage.setItem('customCommands', JSON.stringify(this.customCommands));
    }
};

// Initialize wizard when document is ready
document.addEventListener('DOMContentLoaded', () => {
    CommandWizard.init();
});