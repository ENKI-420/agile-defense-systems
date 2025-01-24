// AIDEN Feature Integration
const AIDEN = {
    // WebSocket connection
    socket: null,
    
    // Connection status
    isConnected: false,
    
    // Initialize AIDEN functionality
    init() {
        this.setupWebSocket();
        this.setupEventListeners();
        this.setupUIHandlers();
        this.setupCSRF();
    },
    
    // WebSocket setup
    setupWebSocket() {
        this.socket = io({
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });
        
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.updateConnectionStatus('connected');
        });
        
        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.updateConnectionStatus('disconnected');
        });
        
        this.socket.on('message', (data) => {
            this.handleIncomingMessage(data);
        });
        
        this.socket.on('typing', () => {
            this.showTypingIndicator();
        });
        
        this.socket.on('stop_typing', () => {
            this.hideTypingIndicator();
        });
        
        this.socket.on('error', (error) => {
            this.handleError(error);
        });
    },
    
    // Event listeners setup
    setupEventListeners() {
        document.getElementById('messageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
        
        document.getElementById('messageInput').addEventListener('input', _.debounce(() => {
            this.socket.emit('typing');
        }, 300));
    },
    
    // UI handlers setup
    setupUIHandlers() {
        document.getElementById('themeToggle').addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
        });
        
        // Avatar update handler
        this.updateAvatar();
    },
    
    // CSRF token setup
    setupCSRF() {
        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        this.socket.emit('csrf_token', token);
    },
    
    // Message handling
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        try {
            await this.socket.emit('message', {
                content: message,
                timestamp: new Date(),
                type: 'user'
            });
            
            input.value = '';
            this.contextManager.addToHistory(message, true);
            this.renderMessage(message, 'user');
            this.personalityModule.updateTraits(message);
        } catch (error) {
            this.handleError(error);
        }
    },
    
    handleIncomingMessage(data) {
        this.hideTypingIndicator();
        this.contextManager.addToHistory(data.content, false);
        this.renderMessage(data.content, 'aiden');
    },
    
    // UI updates
    showTypingIndicator() {
        document.getElementById('typingIndicator').classList.remove('d-none');
    },
    
    hideTypingIndicator() {
        document.getElementById('typingIndicator').classList.add('d-none');
    },
    
    updateConnectionStatus(status) {
        const statusIndicator = document.createElement('div');
        statusIndicator.className = `connection-status ${status}`;
        statusIndicator.textContent = `AIDEN ${status}`;
        document.body.appendChild(statusIndicator);
        setTimeout(() => statusIndicator.remove(), 3000);
    },
    
    updateAvatar() {
        const avatar = document.getElementById('aidenAvatar');
        avatar.src = `/static/images/aiden-${this.personalityModule.getPersonalityProfile().traits.enthusiasm > 0.5 ? 'happy' : 'neutral'}.png`;
    },
    
    renderMessage(content, sender) {
        const container = document.getElementById('messageContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message animate__animated animate__fadeIn`;
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-timestamp">${moment().format('LT')}</div>
        `;
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    },
    
    handleError(error) {
        const errorAlert = document.getElementById('errorAlert');
        errorAlert.textContent = `Error: ${error.message || 'An error occurred'}`;
        errorAlert.classList.remove('d-none');
        setTimeout(() => errorAlert.classList.add('d-none'), 5000);
    },
    
    // Hotkey handler functions
    hotkeys: {
        'i': async () => {
            return await AIDEN.features.ideaVault();
        },
        'p': async () => {
            return await AIDEN.features.projectPlanning();
        },
        'r': async () => {
            return await AIDEN.features.resourceFinder();
        },
        'm': async () => {
            return await AIDEN.features.motivationBoost();
        },
        'c': async () => {
            return await AIDEN.features.carWashControls();
        }
    },

    // Core AIDEN features
    features: {
        async ideaVault() {
            return {
                status: 'success',
                message: 'Opening your idea vault, partner! Let\'s explore those brilliant thoughts of yours...',
                action: 'idea_vault'
            };
        },

        async projectPlanning() {
            return {
                status: 'success',
                message: 'Time to map out our next big adventure! What\'s the vision you\'re looking to bring to life?',
                action: 'project_planning'
            };
        },

        async resourceFinder() {
            return {
                status: 'success',
                message: 'Let\'s find everything you need to make this happen! What resources are we looking for?',
                action: 'resource_finder'
            };
        },

        async motivationBoost() {
            return {
                status: 'success',
                message: 'You\'ve got this, partner! Let\'s break down those challenges and tackle them one by one!',
                action: 'motivation_boost'
            };
        },

        async carWashControls() {
            return {
                status: 'success',
                message: 'Accessing car wash control panel. What aspect of the operation needs attention?',
                action: 'car_wash_controls'
            };
        }
    },

    // Context management for conversation history
    contextManager: {
        history: [],

        addToHistory(message, isUser) {
            this.history.push({
                content: message,
                isUser: isUser,
                timestamp: new Date()
            });

            // Keep only last 10 messages for context
            if (this.history.length > 10) {
                this.history.shift();
            }
        },

        getContext() {
            return this.history;
        }
    },

    // Personality and learning module
    personalityModule: {
        traits: {
            professional: 0.8,
            helpful: 0.9,
            analytical: 0.85,
            enthusiasm: 0.7,
            empathy: 0.8,
            creativity: 0.9,
            motivation: 0.85
        },

        interests: new Set(),
        learnedPreferences: new Map(),

        updateTraits(interaction) {
            // Update personality traits based on interaction
            if (interaction.includes('technical') || interaction.includes('analysis')) {
                this.traits.analytical += 0.05;
            }
            if (interaction.includes('help') || interaction.includes('support')) {
                this.traits.helpful += 0.05;
            }
            if (interaction.includes('!') || interaction.toLowerCase().includes('great')) {
                this.traits.enthusiasm += 0.05;
            }
            if (interaction.includes('feel') || interaction.includes('think')) {
                this.traits.empathy += 0.05;
            }
            if (interaction.includes('idea') || interaction.includes('creative')) {
                this.traits.creativity += 0.05;
            }
            if (interaction.includes('can') || interaction.includes('possible')) {
                this.traits.motivation += 0.05;
            }

            // Normalize traits between 0 and 1
            Object.keys(this.traits).forEach(trait => {
                this.traits[trait] = Math.min(Math.max(this.traits[trait], 0), 1);
            });
        },

        addInterest(topic) {
            this.interests.add(topic.toLowerCase());
        },

        updatePreference(key, value) {
            this.learnedPreferences.set(key, value);
        },

        getPersonalityProfile() {
            return {
                traits: { ...this.traits },
                interests: Array.from(this.interests),
                preferences: Object.fromEntries(this.learnedPreferences)
            };
        }
    }
};

// Initialize AIDEN when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.AIDEN = AIDEN;
    AIDEN.init();
});
