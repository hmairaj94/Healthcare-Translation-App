from flask import Flask, render_template, request, jsonify, session
import requests
import logging
import os
import secrets
import hashlib
import time
from functools import wraps

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log") if not os.environ.get('VERCEL_ENV') else logging.StreamHandler(),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# In production, use a properly secured secret key stored in environment variables
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# Hugging Face API configuration
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/"
HUGGINGFACE_API_KEY = os.environ.get('HUGGINGFACE_API_KEY')  # Set this in your Vercel environment variables
TRANSLATION_TIMEOUT = 15  # seconds (slightly longer for external API)

# Map of target languages to appropriate Hugging Face models
LANGUAGE_MODEL_MAP = {
    "English": "Helsinki-NLP/opus-mt-mul-en",  # multilingual to English
    "Spanish": "Helsinki-NLP/opus-mt-en-es",   # English to Spanish
    "French": "Helsinki-NLP/opus-mt-en-fr",    # English to French
    "German": "Helsinki-NLP/opus-mt-en-de",    # English to German
    "Chinese": "Helsinki-NLP/opus-mt-en-zh",   # English to Chinese
    "Arabic": "Helsinki-NLP/opus-mt-en-ar",    # English to Arabic
    "Hindi": "Helsinki-NLP/opus-mt-en-hi"      # English to Hindi
}

# Headers for Hugging Face API
def get_hf_headers():
    return {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        "Content-Type": "application/json"
    }

# Simple rate limiting decorator
def rate_limit(limit=5, per=60):
    # Skip rate limiting on Vercel due to serverless nature
    if os.environ.get('VERCEL_ENV'):
        def wrapper(f):
            return f
        return wrapper
        
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Get client IP
            client_ip = request.remote_addr
            current_time = time.time()
            
            # Initialize session rate limiting if not exists
            if 'rate_limit' not in session:
                session['rate_limit'] = {'count': 0, 'reset_time': current_time + per}
            
            # Reset counter if time has elapsed
            if current_time > session['rate_limit']['reset_time']:
                session['rate_limit'] = {'count': 0, 'reset_time': current_time + per}
                
            # Check if limit exceeded
            if session['rate_limit']['count'] >= limit:
                logger.warning(f"Rate limit exceeded for IP: {client_ip}")
                return jsonify({"error": "Rate limit exceeded. Please try again later."}), 429
                
            # Increment counter
            session['rate_limit']['count'] += 1
            return f(*args, **kwargs)
        return wrapper
    return decorator

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/translate', methods=['POST'])
@rate_limit(limit=20, per=60)  # 20 requests per minute
def translate():
    try:
        # Validate request data
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
            
        data = request.get_json()
        text = data.get('text', '').strip()
        target_language = data.get('targetLanguage', 'Hindi')
        
        # Input validation
        if not text:
            return jsonify({"error": "No text provided"}), 400
            
        if not isinstance(text, str) or len(text) > 5000:  # Reasonable limit
            return jsonify({"error": "Invalid text format or size"}), 400
            
        # Log translation request (sanitized)
        text_hash = hashlib.sha256(text.encode()).hexdigest()[:8]  # Create hash for logging
        logger.info(f"Translation request: {len(text)} chars, target: {target_language}, hash: {text_hash}")
        
        # Get the appropriate model for the target language
        model_name = LANGUAGE_MODEL_MAP.get(target_language)
        if not model_name:
            return jsonify({"error": f"Unsupported target language: {target_language}"}), 400
        
        # Prepare medical context for better medical translations
        # Adding medical context as a prefix to help guide the translation
        medical_context = "Medical translation: "
        input_text = medical_context + text
        
        # Call Hugging Face API with timeout
        try:
            response = requests.post(
                f"{HUGGINGFACE_API_URL}{model_name}",
                headers=get_hf_headers(),
                json={"inputs": input_text},
                timeout=TRANSLATION_TIMEOUT
            )
        except requests.exceptions.Timeout:
            logger.error("Translation request timed out")
            return jsonify({"error": "Translation service timed out"}), 504
        except requests.exceptions.ConnectionError:
            logger.error("Connection to translation service failed")
            return jsonify({"error": "Translation service unavailable"}), 503
        
        if response.status_code != 200:
            logger.error(f"Hugging Face API error: {response.status_code}, {response.text}")
            return jsonify({"error": "Translation service error"}), 500
        
        # Parse the response
        result = response.json()
        
        # Extract the translated text from the response
        # Hugging Face returns a list of translation objects
        if isinstance(result, list) and len(result) > 0:
            if isinstance(result[0], dict) and 'translation_text' in result[0]:
                translated_text = result[0]['translation_text'].strip()
            else:
                translated_text = result[0].strip()
        else:
            translated_text = str(result).strip()
        
        if not translated_text:
            return jsonify({"error": "Empty translation result"}), 500
        
        # Return translation
        return jsonify({
            "originalText": text,
            "translatedText": translated_text
        })
    
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        # Generic error message to user (avoid exposing implementation details)
        return jsonify({"error": "An error occurred during translation"}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

# Model info endpoint
@app.route('/api/models', methods=['GET'])
def get_available_models():
    return jsonify({
        "availableLanguages": list(LANGUAGE_MODEL_MAP.keys()),
        "provider": "Hugging Face Translation Models"
    })

# Vercel serverless function handler
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Healthcare Translator API is running. Use the web interface.')
        
if __name__ == '__main__':
    # Check if API key is set
    if not HUGGINGFACE_API_KEY:
        logger.warning("HUGGINGFACE_API_KEY not set. Please set this environment variable.")
    
    # In production, use a proper WSGI server and HTTPS
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)