# Healthcare Translation Web App

A real-time, multilingual translation web application designed to improve communication between healthcare providers and patients by providing instant speech-to-text transcription and medical-focused translation.

![Healthcare Translation App Screenshot](https://via.placeholder.com/800x450.png?text=Healthcare+Translation+App)

## 🏥 Features

- **Voice-to-Text Transcription**: Capture spoken words in real-time with high accuracy for medical terminology
- **Real-Time Translation**: Instantly translate between multiple languages with medical terminology support
- **Speech Synthesis**: Audio playback of translated text for better patient communication
- **Mobile-First Design**: Responsive interface optimized for both desktop and mobile use
- **Privacy-Focused**: No data storage, all processing happens in real-time
- **HIPAA Considerations**: Security measures implemented with healthcare privacy in mind

## 🌐 Supported Languages

- English
- Spanish
- French
- German
- Chinese
- Arabic
- Hindi

## 🚀 Live Demo

[View the live application](https://healthcare-translator.vercel.app)

## 🔧 Technical Implementation

### Architecture

The application uses a client-server architecture:
- **Frontend**: HTML, CSS (Tailwind), and JavaScript for the user interface
- **Backend**: Flask for API endpoints and server-side processing
- **AI Translation**: Mistral LLM via Ollama API for medical-focused translations
- **Speech Recognition**: Web Speech API for real-time voice transcription
- **Speech Synthesis**: Web Speech API for audio playback of translated text

### Security Considerations

- No persistent storage of patient data
- Rate limiting to prevent API abuse
- Input validation for all user inputs
- Error handling without exposing implementation details
- HTTPS for secure data transmission (in production)
- Session management with proper timeout

## 📱 How to Use

1. **Select Languages**:
   - Choose your source language (the language being spoken)
   - Choose the target language (the language to translate to)

2. **Record Speech**:
   - Click the microphone button to start recording
   - Speak clearly into your device's microphone
   - The app will transcribe your speech in real-time

3. **View Translation**:
   - Watch as the translation appears in the "Translated Text" section
   - Click the speaker button to hear the translation spoken aloud

4. **Clear and Reset**:
   - Use the clear button (X) to reset both transcripts

## 🛠️ Local Development Setup

### Prerequisites

- Python 3.8 or higher
- Node.js and npm (optional, for frontend development)
- [Ollama](https://ollama.ai/) running locally with Mistral model or alternative LLM API

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/healthcare-translator.git
   cd healthcare-translator
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   # Create a .env file or set these in your environment
   export SECRET_KEY="your_secure_secret_key"
   export OLLAMA_URL="http://localhost:11434/api/generate"  # Or your LLM API URL
   ```

4. Run the application:
   ```bash
   python app.py
   ```

5. Open your browser and navigate to `http://localhost:5000`

## 🧪 Testing

The application includes basic error handling and recovery:
- Microphone permission detection
- Network status monitoring
- Translation service error handling
- Speech recognition recovery attempts

For manual testing:
1. Test with different language combinations
2. Verify medical terminology is correctly translated
3. Check responsive design on various device sizes
4. Confirm error states display user-friendly messages

## 📚 Future Enhancements

- Specialized medical dictionary integration
- Support for more languages and dialects
- Offline mode for basic functionality
- Custom voice selection for audio playback
- Translation history with anonymized data
- Image-to-text for medical documents

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Web Speech API for speech recognition capabilities
- Tailwind CSS for responsive styling
- Mistral LLM for medical translation capabilities
- Vercel for hosting and deployment