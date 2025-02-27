# Healthcare Translation App with Hugging Face Integration

This application enables real-time translation of medical text using Hugging Face's translation models. It features voice recognition for input and text-to-speech for output, making it ideal for healthcare settings where communication across language barriers is critical.

## Features

- **Real-time speech recognition** in multiple languages
- **Medical text translation** using Hugging Face's Helsinki-NLP OPUS-MT models
- **Text-to-speech output** for the translated content
- **Secure implementation** with rate limiting and proper error handling
- **Responsive UI** with Tailwind CSS
- **HIPAA considerations** for healthcare settings

## Setup Instructions

### Prerequisites

- Python 3.7+
- Flask
- A Hugging Face API key

### Installation

1. Clone this repository
   ```
   git clone https://github.com/hmairaj94/Healthcare-Translation-App
   cd Healthcare-Translation-App
   ```

2. Create a virtual environment and install dependencies
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up environment variables
   ```
   # On Linux/macOS
   export HUGGINGFACE_API_KEY="your_huggingface_api_key"
   export SECRET_KEY="your_flask_secret_key"
   
   # On Windows
   set HUGGINGFACE_API_KEY=your_huggingface_api_key
   set SECRET_KEY=your_flask_secret_key
   ```

4. Create the static directory structure
   ```
   mkdir -p static/js static/css static/img
   ```

5. Copy the JavaScript files to the static directory
   - Save the `speech.js` content to `static/js/speech.js`
   - Save the `translation.js` content to `static/js/translation.js`

6. Start the application
   ```
   python app.py
   ```

7. Access the application at `http://localhost:5000`

## Obtaining a Hugging Face API Key

1. Create an account at [Hugging Face](https://huggingface.co/)
2. Go to your profile settings and navigate to the "Access Tokens" section
3. Generate a new token with read access
4. Use this token as your `HUGGINGFACE_API_KEY`
