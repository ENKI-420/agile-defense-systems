import os
import openai
from flask import Flask, request, jsonify
from flask_socketio import SocketIO

# Load OpenAI API key from environment variables
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize Flask app and SocketIO
app = Flask(__name__)
socketio = SocketIO(app)

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
        return "Error generating response"

@app.route('/auto-advance', methods=['GET'])
def auto_advance():
    # Generate response to advance conversation
    global conversation_history
    prompt = f"Continue the conversation: {' '.join(conversation_history)}"
    response = generate_response(prompt)
    conversation_history.append(response)
    return jsonify({"response": response})

@app.route('/auto-enhance', methods=['GET'])
def auto_enhance():
    # Generate enhanced response based on current conversation history
    global conversation_history
    prompt = f"Enhance this conversation with more details: {' '.join(conversation_history)}"
    response = generate_response(prompt)
    conversation_history.append(response)
    return jsonify({"response": response})

@app.route('/recursive-options', methods=['GET'])
def recursive_options():
    # Generate deeper insights into the conversation topic
    global conversation_history
    prompt = f"Provide deeper insights on this topic: {' '.join(conversation_history)}"
    response = generate_response(prompt)
    conversation_history.append(response)
    return jsonify({"response": response})

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
