class AIDENChat {
    constructor() {
        this.messages = [];
        this.isMinimized = false;
        this.isTyping = false;
        this.initialized = false;
        this.context = {
            lastTopic: null,
            securityLevel: 'unclassified'
        };
    }

    init() {
        if (this.initialized) return;
        this.createChatInterface();
        this.bindEventListeners();
        this.initialized = true;
    }

    createChatInterface() {
        const chatHTML = `
            <div id="aiden-chat" class="aiden-chat" role="dialog" aria-label="AIDEN Defense AI Assistant">
                <div class="aiden-header">
                    <div class="aiden-status">
                        <span class="status-indicator"></span>
                        <span class="status-text">AIDEN Defense AI</span>
                    </div>
                    <div class="aiden-controls">
                        <button class="minimize-btn" aria-label="Minimize chat">−</button>
                        <button class="close-btn" aria-label="Close chat">×</button>
                    </div>
                </div>
                <div class="aiden-messages" role="log" aria-live="polite">
                    <div class="welcome-message">
                        <div class="quantum-logo"></div>
                        <p>Welcome to AIDEN - Advanced Intelligent Defense Expert Navigator</p>
                        <p class="security-notice">SECURITY NOTICE: Unclassified discussions only</p>
                    </div>
                </div>
                <div class="aiden-typing" aria-hidden="true">
                    <span></span><span></span><span></span>
                </div>
                <form class="aiden-input" onsubmit="return false;">
                    <input type="text" 
                        placeholder="Ask about defense systems, cybersecurity, or quantum technology..." 
                        aria-label="Chat input"
                        maxlength="500">
                    <button type="submit" aria-label="Send message">
                        <svg viewBox="0 0 24 24"><path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/></svg>
                    </button>
                </form>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    bindEventListeners() {
        const chat = document.getElementById('aiden-chat');
        const input = chat.querySelector('input');
        const form = chat.querySelector('form');
        const minimizeBtn = chat.querySelector('.minimize-btn');
        const closeBtn = chat.querySelector('.close-btn');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserMessage(input.value);
            input.value = '';
        });

        minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        closeBtn.addEventListener('click', () => this.closeChat());

        // Security features
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text');
            if (this.validateInput(text)) {
                input.value += text;
            }
        });
    }

    validateInput(text) {
        // Basic security validation
        const sensitivePatterns = [
            /classified/i,
            /secret/i,
            /confidential/i,
            /\b(ssh|private)\s*key\b/i
        ];
        return !sensitivePatterns.some(pattern => pattern.test(text));
    }

    async handleUserMessage(message) {
        if (!message.trim() || !this.validateInput(message)) return;

        this.addMessage('user', message);
        this.showTypingIndicator();

        try {
            const response = await this.processMessage(message);
            this.hideTypingIndicator();
            this.addMessage('aiden', response);
        } catch (error) {
            this.hideTypingIndicator();
            this.handleError(error);
        }
    }

    async processMessage(message) {
        // Simulate AI processing with security checks
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        // Context-aware response generation would go here
        return "I understand you're asking about [topic]. Let me provide relevant information while ensuring we maintain appropriate security protocols.";
    }

    addMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `
            <div class="message-content">
                ${this.sanitizeHTML(content)}
            </div>
            <div class="message-timestamp">
                ${new Date().toLocaleTimeString()}
            </div>`;

        const messages = document.querySelector('.aiden-messages');
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    sanitizeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTypingIndicator() {
        document.querySelector('.aiden-typing').classList.add('active');
    }

    hideTypingIndicator() {
        document.querySelector('.aiden-typing').classList.remove('active');
    }

    toggleMinimize() {
        const chat = document.getElementById('aiden-chat');
        this.isMinimized = !this.isMinimized;
        chat.classList.toggle('minimized');
    }

    closeChat() {
        document.getElementById('aiden-chat').remove();
        this.initialized = false;
    }

    handleError(error) {
        console.error('AIDEN Chat Error:', error);
        this.addMessage('system', 'An error occurred. Please try again.');
    }
}

// Initialize AIDEN
document.addEventListener('DOMContentLoaded', () => {
    window.AIDEN = new AIDENChat();
    window.AIDEN.init();
});

