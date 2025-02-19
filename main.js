document.addEventListener('keydown', function (e) {
    if (e.key === '1') {
        // Trigger auto-advance logic
        fetch('/auto-advance')
            .then(response => response.json())
            .then(data => displayResponse(data));
    } else if (e.key === '2') {
        // Trigger auto-enhance logic
        fetch('/auto-enhance')
            .then(response => response.json())
            .then(data => displayResponse(data));
    } else if (e.key === '3') {
        // Trigger recursive options logic
        fetch('/recursive-options')
            .then(response => response.json())
            .then(data => displayResponse(data));
    }
});

function displayResponse(data) {
    // Function to display the AI response in the UI
    const chatWindow = document.getElementById("chatWindow");
    const message = document.createElement("p");
    message.textContent = data.response;
    chatWindow.appendChild(message);
}
