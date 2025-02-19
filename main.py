import os
import openai
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Initialize Flask app and SocketIO
app = Flask(__name__)
socketio = SocketIO(app)

# Set OpenAI API Key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

conversation_history = []  # Store conversation history for context

# Function to generate responses from OpenAI
def generate_response(prompt):
    try:
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=150
        )
        return response.choices[0].text.strip()
    except Exception as e:
        app.logger.error(f"OpenAI API error: {e}")
        return "Sorry, I couldn't process your request."

# Route to serve index.html (home page)
@app.route('/')
def index():
    return render_template('index.html')  # Make sure 'index.html' is in the 'templates' folder

# Handle favicon requests (to avoid 404 errors)
@app.route('/favicon.ico')
def favicon():
    return '', 204  # No content response for favicon

# Route to handle auto-advance (AI generates next part of the conversation)
@app.route('/auto-advance', methods=['POST'])
def auto_advance():
    data = request.get_json()
    user_message = data.get('message', '')
    conversation_history.append(user_message)
    prompt = f"Continue the conversation: {' '.join(conversation_history)}"
    response = generate_response(prompt)
    conversation_history.append(response)
    return jsonify({"response": response})

# Route to handle auto-enhance (AI enhances the current conversation)
@app.route('/auto-enhance', methods=['POST'])
def auto_enhance():
    data = request.get_json()
    user_message = data.get('message', '')
    conversation_history.append(user_message)
    prompt = f"Enhance this conversation with more details: {' '.join(conversation_history)}"
    response = generate_response(prompt)
    conversation_history.append(response)
    return jsonify({"response": response})

# Route to handle recursive options (AI provides deeper insights)
@app.route('/recursive-options', methods=['POST'])
def recursive_options():
    data = request.get_json()
    user_message = data.get('message', '')
    conversation_history.append(user_message)
    prompt = f"Provide deeper insights on this topic: {' '.join(conversation_history)}"
    response = generate_response(prompt)
    conversation_history.append(response)
    return jsonify({"response": response})

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
