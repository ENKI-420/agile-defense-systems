// Multi-Model Chat Integration
const MultiModelChat = {
    activeModels: new Set(),
    modelConfigs: {
        'aiden': {
            endpoint: 'https://chatgpt.com/g/g-673b2d9ab8e081918641aa2586e99c67-aiden',
            temperature: 0.7,
            maxTokens: 2048
        },
        'llama': {
            endpoint: '/api/llama',
            temperature: 0.7,
            maxTokens: 2048
        },
        'gemma': {
            endpoint: '/api/gemma',
            temperature: 0.7,
            maxTokens: 2048
        },
        'mistral': {
            endpoint: '/api/mistral',
            temperature: 0.7,
            maxTokens: 2048
        }
    },
    credentials: {},
    
    init() {
        this.setupEventListeners();
        this.loadConfigs();
        this.initializeUI();
    },
    
    setupEventListeners() {
        // Model toggle handlers
        document.querySelectorAll('.model-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => this.toggleModel(e.target.value, e.target.checked));
        });
        
        // Configuration update handlers
        document.querySelectorAll('.model-config').forEach(input => {
            input.addEventListener('change', (e) => this.updateModelConfig(e.target.dataset.model, e.target.name, e.target.value));
        });
        
        // Message submission
        document.getElementById('sendMessage').addEventListener('click', () => this.sendMessage());
    },
    
    loadConfigs() {
        // Load saved configurations from secure storage
        const savedConfigs = localStorage.getItem('model_configs');
        if (savedConfigs) {
            try {
                const configs = JSON.parse(atob(savedConfigs));
                this.modelConfigs = {...this.modelConfigs, ...configs};
            } catch (e) {
                console.error('Failed to load configurations');
            }
        }
    },
    
    async toggleModel(modelId, enabled) {
        if (enabled) {
            this.activeModels.add(modelId);
            await this.initializeModel(modelId);
        } else {
            this.activeModels.delete(modelId);
        }
        this.updateUI();
    },
    
    async initializeModel(modelId) {
        if (!this.credentials[modelId]) {
            await this.promptForCredentials(modelId);
        }
        // Initialize model-specific features
        const config = this.modelConfigs[modelId];
        // Setup model-specific handlers
    },
    
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        if (!message || this.activeModels.size === 0) return;
        
        input.value = '';
        this.addMessageToChat('user', message);
        
        // Send to all active models
        for (const modelId of this.activeModels) {
            try {
                const response = await this.queryModel(modelId, message);
                this.addMessageToChat(modelId, response);
            } catch (error) {
                console.error(`Error with ${modelId}:`, error);
                this.handleError(modelId, error);
            }
        }
    },
    
    async queryModel(modelId, message) {
        const config = this.modelConfigs[modelId];
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.credentials[modelId]}`
            },
            body: JSON.stringify({
                message,
                temperature: config.temperature,
                max_tokens: config.maxTokens
            })
        });
        
        if (!response.ok) throw new Error('API request failed');
        return (await response.json()).response;
    },
    
    addMessageToChat(sender, content) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="model-indicator">${sender}</span>
                <span class="timestamp">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="message-content">
                ${marked.parse(content)}
            </div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
    
    updateUI() {
        // Update UI to reflect active models and their states
        document.querySelectorAll('.model-config-section').forEach(section => {
            const modelId = section.dataset.model;
            section.style.display = this.activeModels.has(modelId) ? 'block' : 'none';
        });
    },
    
    handleError(modelId, error) {
        console.error(`${modelId} Error:`, error);
        this.addMessageToChat('system', `Error with ${modelId}: ${error.message}`);
    },
    
    async promptForCredentials(modelId) {
        // Implement secure credential prompting
        // Store credentials securely
    }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => MultiModelChat.init());

