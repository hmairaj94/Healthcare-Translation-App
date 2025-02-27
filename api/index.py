from flask import Flask, request, jsonify, send_from_directory
import os
import sys

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import your Flask app
from app import app as flask_app

# Handle static files
@flask_app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('./static', path)

# For Vercel serverless deployment
app = flask_app