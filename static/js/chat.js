document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const messageContainer = document.getElementById('messageContainer');
    const aidenAvatar = document.getElementById('aidenAvatar');

    // Load AIDEN's avatar
    fetch('/api/avatar')
        .then(response => response.json())
        .then(data => {
            aidenAvatar.src = data.avatar;
        })
        .catch(error => console.error('Error loading avatar:', error));

    // Initialize socket connection
    socket.on('connect', () => {
        console.log('Connected to server');
        appendMessage('Welcome to Jake\'s Digital Car Wash Assistant! I\'m AIDEN, and I\'m here to help you with all your car wash needs. How can I assist you today?', false);
    });

    // Handle form submission
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();

        if (message) {
            // Send message to server
            socket.emit('send_message', { message });

            // Display user message
            appendMessage(message, true);

            // Clear input
            messageInput.value = '';
        }
    });

    // Handle received messages
    socket.on('receive_message', (data) => {
        appendMessage(data.message, data.is_user);
    });

    // Append message to chat container
    function appendMessage(message, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'aiden'}`;

        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="message-timestamp text-muted small">${timestamp}</div>
        `;

        messageContainer.appendChild(messageDiv);
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    // Handle hotkeys for car wash specific features
    document.addEventListener('keydown', (e) => {
        if (e.target === messageInput) {
            return; // Don't trigger hotkeys while typing
        }

        const hotkeys = {
            'w': 'Checking current wash status and queue...',
            'm': 'Running maintenance diagnostics...',
            'p': 'Retrieving current pricing information...',
            's': 'Fetching service schedule...',
            'd': 'Generating diagnostic report...'
        };

        if (hotkeys[e.key.toLowerCase()]) {
            appendMessage(`AIDEN: ${hotkeys[e.key.toLowerCase()]}`, false);
            socket.emit('send_message', { 
                message: `[Hotkey ${e.key.toUpperCase()}] ${hotkeys[e.key.toLowerCase()]}`
            });
        }
    });
});