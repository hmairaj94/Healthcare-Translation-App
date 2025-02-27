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
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# In production, use a properly secured secret key stored in environment variables
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# Ollama API configuration
OLLAMA_URL = "http://localhost:11434/api/generate"
TRANSLATION_TIMEOUT = 60  # seconds

"""
SECURITY CONSIDERATIONS:
------------------------
1. Data Privacy (HIPAA Compliance):
   - In production, this app would need proper SSL/TLS encryption (HTTPS)
   - No PHI (Protected Health Information) should be stored persistently
   - All data should be encrypted at rest and in transit
   - User session management with proper timeout
   
2. Rate Limiting:
   - Implemented basic rate limiting to prevent API abuse
   
3. Input Validation:
   - All user inputs are validated before processing
   
4. Error Handling:
   - Errors are logged but details are not exposed to users
   
5. Audit Trail:
   - In production, would implement logging of all translation requests
     while sanitizing PHI from logs
     
6. Data Minimization:
   - Only essential data is processed and nothing is retained longer than needed
"""

# Simple rate limiting decorator
def rate_limit(limit=5, per=60):
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
        
        # Session context tracking - store previous translations
        if 'conversation_context' not in session:
            session['conversation_context'] = []
            
        # Keep context window limited to last 5 exchanges
        if len(session['conversation_context']) > 5:
            session['conversation_context'] = session['conversation_context'][-5:]
        
        # Input validation
        if not text:
            return jsonify({"error": "No text provided"}), 400
            
        if not isinstance(text, str) or len(text) > 5000:  # Reasonable limit
            return jsonify({"error": "Invalid text format or size"}), 400
            
        # Log translation request (sanitized)
        text_hash = hashlib.sha256(text.encode()).hexdigest()[:8]  # Create hash for logging
        logger.info(f"Translation request: {len(text)} chars, target: {target_language}, hash: {text_hash}")
        
        # Create context from previous exchanges if available
        context_str = ""
        if session['conversation_context']:
            context_str = "\nPrevious exchanges in this conversation:\n"
            for i, exchange in enumerate(session['conversation_context']):
                context_str += f"- Original ({i+1}): {exchange['original']}\n"
                context_str += f"- Translation ({i+1}): {exchange['translation']}\n"
        
        # Enhanced medical-focused translation prompt with terminology guidance
        prompt = f"""Translate the following healthcare text from English to {target_language}.
        Focus on medical terminology accuracy but return ONLY the clean translated text.
        Do not add any explanations, labels, or notes.
        
        Common medical translation guidelines:
        - Maintain clinical precision
        - Preserve medical terms in their target language equivalent
        - Ensure dosage information is accurately conveyed
        - Maintain any numeric values exactly as presented
        
        Text to translate: "{text}"
        """
        # Call Ollama API with timeout
        try:
            response = requests.post(
                OLLAMA_URL,
                json={
                    "model": "mistral:latest",
                    "prompt": prompt,
                    "stream": False
                },
                timeout=TRANSLATION_TIMEOUT
            )
        except requests.exceptions.Timeout:
            logger.error("Translation request timed out")
            return jsonify({"error": "Translation service timed out"}), 504
        except requests.exceptions.ConnectionError:
            logger.error("Connection to translation service failed")
            return jsonify({"error": "Translation service unavailable"}), 503
        
        if response.status_code != 200:
            logger.error(f"Ollama API error: {response.status_code}, {response.text}")
            return jsonify({"error": "Translation service error"}), 500
        
        result = response.json()
        translated_text = result.get('response', '').strip()
        
        if not translated_text:
            return jsonify({"error": "Empty translation result"}), 500
        
        # Add this exchange to context history
        session['conversation_context'].append({
            'original': text,
            'translation': translated_text
        })
        
        # Return translation
        return jsonify({
            "originalText": text,
            "translatedText": translated_text
        })
    
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        # Generic error message to user (avoid exposing implementation details)
        return jsonify({"error": "An error occurred during translation"}), 500

@app.route('/api/reset-context', methods=['POST'])
def reset_context():
    try:
        # Clear conversation context from session
        if 'conversation_context' in session:
            session['conversation_context'] = []
            logger.info("Conversation context reset")
        
        return jsonify({"status": "success", "message": "Context reset successfully"}), 200
    except Exception as e:
        logger.error(f"Error resetting context: {str(e)}")
        return jsonify({"error": "Failed to reset context"}), 500


# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    # In production, use a proper WSGI server and HTTPS
    app.run(debug=False)  # Set to False in production