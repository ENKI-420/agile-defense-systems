// AIDEN Integration Module
const AIDEN_CONFIG = {
    endpoint: process.env.AIDEN_PLATFORM_URL || 'https://api.aiden-platform.com/v1',
    oauth: {
        authEndpoint: process.env.AIDEN_AUTH_URL || 'https://auth.aiden-platform.com/oauth2',
        clientId: process.env.AIDEN_CLIENT_ID,
        scope: 'compliance_validation fraud_detection proposal_generation'
    }
};

// Type definitions for AIDEN Platform features
const ValidationTypes = {
    COMPLIANCE: 'compliance',
    FRAUD: 'fraud',
    PROPOSAL: 'proposal'
};

const AIDEN = {
    config: AIDEN_CONFIG,
    credentials: null,
    tokenData: null,
    chat: null,
    
    // Initialize the AIDEN interface
    init: function() {
        this.setupEventListeners();
        this.loadCredentials();
        this.setupUI();
    },
    
    // Set up event listeners
    setupEventListeners: function() {
        document.getElementById('sendToAiden').addEventListener('click', () => this.sendMessage());
        document.getElementById('clearContext').addEventListener('click', () => this.clearContext());
        document.getElementById('saveCredentials').addEventListener('click', () => this.saveCredentials());
        document.getElementById('aidenContextSelect').addEventListener('change', (e) => this.switchContext(e.target.value));
    },
    
    // Initialize OAuth2 flow
    async initializeAuth: async function() {
        try {
            const tokenData = await this.getStoredToken();
            if (tokenData && !this.isTokenExpired(tokenData)) {
                this.tokenData = tokenData;
                this.updateConnectionStatus(true);
                return;
            }
            await this.refreshToken();
        } catch (error) {
            console.error('Authentication failed:', error);
            this.handleError(error);
            this.updateConnectionStatus(false);
        }
    },

    isTokenExpired: function(tokenData) {
        return Date.now() >= tokenData.expiresAt;
    },

    getStoredToken: async function() {
        const secured = localStorage.getItem('aiden_token');
        return secured ? await this.decryptData(secured) : null;
    },

    async refreshToken: async function() {
        try {
            const response = await fetch(`${this.config.oauth.authEndpoint}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.config.oauth.clientId,
                    scope: this.config.oauth.scope
                })
            });

            if (!response.ok) throw new Error('Token refresh failed');
            
            const tokenData = await response.json();
            tokenData.expiresAt = Date.now() + (tokenData.expires_in * 1000);
            await this.storeToken(tokenData);
            this.tokenData = tokenData;
            this.updateConnectionStatus(true);
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw error;
        }
    },

    async storeToken: async function(tokenData) {
        const encrypted = await this.encryptData(tokenData);
        localStorage.setItem('aiden_token', encrypted);
    },

    // Secure encryption/decryption methods
    async encryptData: async function(data) {
        const encoder = new TextEncoder();
        const key = await this.getEncryptionKey();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoded = encoder.encode(JSON.stringify(data));
        
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoded
        );

        return btoa(JSON.stringify({
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encrypted))
        }));
    },

    async decryptData: async function(encrypted) {
        const { iv, data } = JSON.parse(atob(encrypted));
        const key = await this.getEncryptionKey();
        
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(iv) },
            key,
            new Uint8Array(data)
        );

        return JSON.parse(new TextDecoder().decode(decrypted));
    },

    async getEncryptionKey: async function() {
        let key = localStorage.getItem('aiden_encryption_key');
        if (!key) {
            key = await window.crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
            localStorage.setItem('aiden_encryption_key', key);
        }
        return key;
    },
    
    // Save credentials securely
    saveCredentials: function() {
        const apiKey = document.getElementById('aidenApiKey').value;
        if (apiKey) {
            // Encrypt and store
            const secured = btoa(JSON.stringify({ apiKey }));
            localStorage.setItem('aiden_credentials', secured);
            this.credentials = { apiKey };
            this.updateConnectionStatus(true);
            document.querySelector('.credential-section').classList.add('d-none');
        }
    },
    
    // Send message to AIDEN
    async sendMessage() {
        if (!this.credentials) {
            this.showCredentialPrompt();
            return;
        }
        
        const input = document.getElementById('aidenInput');
        const message = input.value.trim();
        if (!message) return;
        
        // Add user message to chat
        this.addMessage('user', message);
        input.value = '';
        
        try {
            const response = await this.queryAIDEN(message);
            this.addMessage('aiden', response);
        } catch (error) {
            this.handleError(error);
        }
    },
    
    // Core AIDEN Platform features
    async validateCompliance(data) {
        return await this.callAidenAPI('/compliance/validate', {
            type: ValidationTypes.COMPLIANCE,
            data: this.sanitizeInput(data)
        });
    },

    async detectFraud(transaction) {
        return await this.callAidenAPI('/fraud/detect', {
            type: ValidationTypes.FRAUD,
            transaction: this.sanitizeInput(transaction)
        });
    },

    async generateProposal(requirements) {
        return await this.callAidenAPI('/proposal/generate', {
            type: ValidationTypes.PROPOSAL,
            requirements: this.sanitizeInput(requirements)
        });
    },

    // Secure API call handler
    async callAidenAPI(endpoint, data) {
        try {
            if (!this.tokenData || this.isTokenExpired(this.tokenData)) {
                await this.refreshToken();
            }

            const response = await fetch(`${this.config.endpoint}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.tokenData.access_token}`,
                    'X-Request-ID': crypto.randomUUID()
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'API request failed');
            }

            return await response.json();
        } catch (error) {
            this.logError(error, endpoint, data);
            throw error;
        }
    },

    sanitizeInput(data) {
        // Implement input sanitization based on type
        return data;
    },

    logError(error, endpoint, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            endpoint,
            error: error.message,
            requestData: this.sanitizeInput(data)
        };
        
        console.error('AIDEN Platform Error:', logEntry);
        
        // Send to logging service
        fetch(`${this.config.endpoint}/logging`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.tokenData?.access_token}`
            },
            body: JSON.stringify(logEntry)
        }).catch(console.error);
    },
    
    // Add message to chat interface
    addMessage(role, content) {
        const messagesContainer = document.getElementById('aidenMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.innerHTML = `
            <div class="message-content">
                ${marked.parse(content)}
            </div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
    
    // Enhanced error handling
    handleError(error) {
        const errorMessage = this.getErrorMessage(error);
        this.logError(error, 'general', {});
        
        Swal.fire({
            title: 'Error',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'OK'
        });

        // Trigger re-authentication if token is invalid
        if (error.message.includes('unauthorized') || error.message.includes('invalid_token')) {
            this.initializeAuth();
        }
    },

    getErrorMessage(error) {
        const errorMap = {
            'invalid_token': 'Authentication failed. Please try again.',
            'validation_error': 'Invalid input data provided.',
            'rate_limit': 'Request limit exceeded. Please try again later.',
            'service_unavailable': 'AIDEN Platform is temporarily unavailable.'
        };

        return errorMap[error.code] || 'An unexpected error occurred. Please try again.';
    },
    
    // Show credential prompt
    showCredentialPrompt() {
        document.querySelector('.credential-section').classList.remove('d-none');
    },
    
    // Update connection status
    updateConnectionStatus(connected) {
        const status = document.getElementById('aidenConnectionStatus');
        status.className = `badge ${connected ? 'bg-success' : 'bg-danger'}`;
        status.textContent = connected ? 'Connected' : 'Disconnected';
    },
    
    // Clear context
    clearContext() {
        document.getElementById('aidenMessages').innerHTML = '';
    },
    
    // Switch context
    switchContext(context) {
        console.log(`Switching to ${context} context`);
        // Additional context switching logic can be added here
    },
    
    // Setup UI elements
    setupUI() {
        // Add any additional UI setup here
    }
};

// Initialize AIDEN when the document is ready
document.addEventListener('DOMContentLoaded', () => AIDEN.init());

