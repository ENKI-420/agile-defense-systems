// Chat Interface Functionality
document.addEventListener('DOMContentLoaded', () => {
    initializeChatInterface();
});

function initializeChatInterface() {
    const socket = io();
    
    // Socket event handlers
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('receive_message', (data) => {
        appendMessage(data.message, data.timestamp, false, data.emotion);
    });
    
    socket.on('error', (data) => {
        console.error('Socket error:', data.message);
    });
}

function appendMessage(message, timestamp, isUser, emotion = null) {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isUser ? 'user-message' : 'aiden-message'}`;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = timestamp;
        
        const contentP = document.createElement('p');
        contentP.textContent = message;
        
        messageDiv.appendChild(timeSpan);
        messageDiv.appendChild(contentP);
        
        if (emotion) {
            const emotionSpan = document.createElement('span');
            emotionSpan.className = 'message-emotion';
            emotionSpan.textContent = emotion;
            messageDiv.appendChild(emotionSpan);
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Export functions for use in other modules
window.ChatInterface = {
    appendMessage,
    initializeChatInterface
};
