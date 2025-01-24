// Touch Command Integration
const VoiceCommands = {
    isListening: false,
    commandFeedback: null,
    touchStartTime: 0,
    lastGesture: null,
    gestureTimeout: null,

    // Initialize command system
    init() {
        this.createFeedbackElement();
        this.setupTouchCommands();
        this.setupVoiceCommands();
        this.setupKeyboardCommands(); // Keep keyboard support for desktop
    },

    // Setup keyboard commands
    setupKeyboardCommands() {
        document.addEventListener('keydown', (event) => {
            if (this.isListening && !event.repeat) {
                this.handleKeyCommand(event);
            }

            // Toggle listening mode with Alt+C
            if (event.altKey && event.key.toLowerCase() === 'c') {
                if (!this.isListening) {
                    this.startListening();
                } else {
                    this.stopListening();
                }
                event.preventDefault();
            }
        });
    },

    // Setup voice commands if available
    setupVoiceCommands() {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onresult = (event) => {
                const last = event.results.length - 1;
                const command = event.results[last][0].transcript.trim().toLowerCase();
                this.handleCommand(command, 1.0);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.updateFeedbackStatus('Voice recognition error: ' + event.error);
            };
        } else {
            console.error('Speech recognition not supported');
        }
    },

    // Handle keyboard commands
    handleKeyCommand(event) {
        const key = event.key.toLowerCase();
        let command = '';

        switch (key) {
            case 'n':
                command = 'new_project';
                break;
            case 'v':
                command = 'view_projects';
                break;
            case 'm':
                command = 'show_motivation';
                break;
            case 'escape':
                this.stopListening();
                return;
            default:
                return;
        }

        if (command) {
            this.handleCommand(command, 1.0);
        }
    },

    // Setup touch commands
    setupTouchCommands() {
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (event) => {
            if (this.isListening) {
                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
                this.touchStartTime = Date.now();
            }
        });

        document.addEventListener('touchmove', (event) => {
            if (!this.isListening) return;

            const touchMoveX = event.touches[0].clientX;
            const touchMoveY = event.touches[0].clientY;
            const deltaX = touchMoveX - touchStartX;
            const deltaY = touchMoveY - touchStartY;

            this.showGestureFeedback(deltaX, deltaY);
        });

        document.addEventListener('touchend', (event) => {
            if (!this.isListening) return;

            const touchEndX = event.changedTouches[0].clientX;
            const touchEndY = event.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const gestureTime = Date.now() - this.touchStartTime;

            if (this.gestureTimeout) {
                clearTimeout(this.gestureTimeout);
            }

            if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
                const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / gestureTime;

                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX > 0) {
                        this.handleCommand('swipeRight', velocity);
                    } else {
                        this.handleCommand('swipeLeft', velocity);
                    }
                } else {
                    if (deltaY < 0) {
                        this.handleCommand('swipeUp', velocity);
                    }
                }
            }
        });
    },

    // Show gesture feedback
    showGestureFeedback(deltaX, deltaY) {
        let gesture = '';
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            gesture = deltaX > 0 ? '→' : '←';
        } else if (deltaY < 0) {
            gesture = '↑';
        }

        if (gesture && gesture !== this.lastGesture) {
            this.lastGesture = gesture;
            this.updateFeedbackStatus(`Gesture: ${gesture}`);

            if (this.gestureTimeout) {
                clearTimeout(this.gestureTimeout);
            }

            this.gestureTimeout = setTimeout(() => {
                this.lastGesture = null;
                this.updateFeedbackStatus(this.isListening ? 'Command mode active' : '');
            }, 1000);
        }
    },

    // Create feedback element
    createFeedbackElement() {
        if (!this.commandFeedback) {
            this.commandFeedback = document.createElement('div');
            this.commandFeedback.className = 'voice-feedback';
            document.body.appendChild(this.commandFeedback);
        }
    },

    // Update feedback status
    updateFeedbackStatus(message) {
        if (this.commandFeedback) {
            this.commandFeedback.textContent = message;
            this.commandFeedback.className = 'voice-feedback ' +
                (this.isListening ? 'listening' : '');

            this.commandFeedback.classList.add('feedback-update');
            setTimeout(() => {
                this.commandFeedback.classList.remove('feedback-update');
            }, 300);
        }
    },

    // Start listening
    startListening() {
        this.isListening = true;
        if (this.recognition) {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error starting voice recognition:', error);
            }
        }
        this.updateFeedbackStatus('Command mode active - Voice, touch, or keyboard');
    },

    // Stop listening
    stopListening() {
        this.isListening = false;
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.error('Error stopping voice recognition:', error);
            }
        }
        this.updateFeedbackStatus('Command mode disabled');
        setTimeout(() => this.updateFeedbackStatus(''), 2000);
    },

    // Handle command with velocity
    handleCommand(command, velocity = 1.0) {
        command = command.replace(/ /g, '_').toLowerCase();

        switch (command) {
            case 'new_project':
            case 'view_projects':
            case 'show_motivation':
                this.handleUICommand(command, velocity);
                break;
            case 'swiperight':
            case 'swipeleft':
            case 'swipeup':
                this.handleSwipeCommand(command, velocity);
                break;
            default:
                this.handleContextualCommand(command, velocity);
                break;
        }

        this.updateFeedbackStatus(`Executing: ${command.replace(/_/g, ' ')}`);
        setTimeout(() => this.updateFeedbackStatus('Command mode active'), 1500);
    },

    // Handle UI commands
    handleUICommand(command, velocity) {
        const actions = {
            new_project: () => {
                const modal = document.querySelector('[data-bs-target="#newProjectModal"]');
                if (modal) {
                    modal.click();
                    this.animateElement(modal);
                }
            },
            view_projects: () => {
                document.querySelectorAll('.project-card').forEach(card => {
                    this.animateElement(card, velocity);
                });
            },
            show_motivation: () => {
                const motivationText = document.querySelector('#motivationText');
                if (motivationText) {
                    motivationText.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    this.animateElement(motivationText);
                }
            }
        };

        if (actions[command]) {
            actions[command]();
        }
    },

    // Handle swipe commands
    handleSwipeCommand(command, velocity) {
        const animations = {
            swiperight: { transform: 'translateX(50px)', duration: 300 },
            swipeleft: { transform: 'translateX(-50px)', duration: 300 },
            swipeup: { transform: 'translateY(-50px)', duration: 300 }
        };

        const animation = animations[command];
        if (animation) {
            const element = document.activeElement || document.body;
            this.animateElement(element, velocity, animation);
        }
    },

    // Handle contextual commands
    handleContextualCommand(command, velocity) {
        const animations = {
            next_milestone: { transform: 'translateX(100%)', duration: 300 },
            previous_milestone: { transform: 'translateX(-100%)', duration: 300 },
            project_overview: { transform: 'scale(1.1)', duration: 200 },
            next_message: { transform: 'translateY(-20px)', duration: 200 },
            quick_reply: { transform: 'scale(0.95)', duration: 150 },
            show_context: { transform: 'translateY(20px)', duration: 200 }
        };

        const element = this.getContextualElement(command);
        if (element && animations[command]) {
            this.animateElement(element, velocity, animations[command]);
        }
    },

    // Get contextual element
    getContextualElement(command) {
        const selectors = {
            next_milestone: '.milestone.active',
            previous_milestone: '.milestone.active',
            project_overview: '.project-card.active',
            next_message: '.chat-message:last-child',
            quick_reply: '.quick-reply-panel',
            show_context: '.context-panel'
        };

        return document.querySelector(selectors[command]);
    },

    // Animate element
    animateElement(element, velocity = 1.0, customAnimation = null) {
        if (!element) return;

        const duration = customAnimation ? customAnimation.duration : 500;
        const transform = customAnimation ? customAnimation.transform : 'scale(1.02)';

        element.style.transition = `transform ${duration * (1/velocity)}ms ease-out`;
        element.style.transform = transform;

        setTimeout(() => {
            element.style.transform = '';
        }, duration);
    }
};

// Initialize commands when document is ready
document.addEventListener('DOMContentLoaded', () => {
    VoiceCommands.init();

    // Add command button to the interface
    const commandButton = document.createElement('button');
    commandButton.className = 'btn btn-primary voice-control-btn';
    commandButton.innerHTML = '<i class="bi bi-hand-index-thumb"></i>';
    commandButton.title = 'Voice/Touch Commands';
    document.body.appendChild(commandButton);

    // Toggle command recognition on button click
    commandButton.addEventListener('click', () => {
        if (!VoiceCommands.isListening) {
            VoiceCommands.startListening();
        } else {
            VoiceCommands.stopListening();
        }
    });
});