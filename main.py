import eventlet_init

import logging
from app import app, socketio

if __name__ == "__main__":
    try:
        # Set Werkzeug logger to INFO to reduce debug noise
        logging.getLogger('werkzeug').setLevel(logging.INFO)
        app.logger.info("Starting server...")

        # Push application context
        with app.app_context():
            # Initialize any required resources
            app.logger.info("Initializing application resources...")

            # Start the server
            socketio.run(
                app,
                host='0.0.0.0',
                port=5000,
                debug=True,
                use_reloader=True,
                log_output=True
            )
    except Exception as e:
        app.logger.error(f"Error starting server: {e}")
        raise e