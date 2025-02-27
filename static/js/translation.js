let translateTimeout;

// Function to translate text
function translateText(text) {
    // Clear any pending translation requests
    clearTimeout(translateTimeout);
    
    // Don't attempt translation if text is empty
    if (!text.trim()) return;
    
    // Set a small delay to avoid too many requests during continuous speech
    translateTimeout = setTimeout(() => {
        const targetLanguage = document.getElementById('targetLanguage').value;
        const translatedTextElement = document.getElementById('translatedText');
        const loadingElement = document.getElementById('translationLoading');
        const speakButton = document.getElementById('speakButton');
        
        // Get or create error banner
        let errorBanner = document.getElementById('errorBanner');
        if (!errorBanner) {
            errorBanner = document.createElement('div');
            errorBanner.id = 'errorBanner';
            errorBanner.className = 'hidden p-2 mt-2 mb-2 text-sm text-white bg-red-500 rounded';
            document.querySelector('.container').appendChild(errorBanner);
        }
        
        // Hide any previous error messages
        errorBanner.classList.add('hidden');
        
        // Show loading indicator with pulsing animation
        loadingElement.classList.remove('hidden');
        translatedTextElement.textContent = '';
        
        // Make API call to translate
        fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                targetLanguage: targetLanguage
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Translation request failed: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            translatedTextElement.textContent = data.translatedText;
            speakButton.disabled = false;
            
            // Flash the background to indicate new translation
            translatedTextElement.classList.add('bg-green-50');
            setTimeout(() => {
                translatedTextElement.classList.remove('bg-green-50');
            }, 300);
        })
        .catch(error => {
            console.error('Translation error:', error);
            // Show user-friendly error message
            errorBanner.textContent = `Translation failed: ${error.message}. Please try again.`;
            errorBanner.classList.remove('hidden');
            // Add small amount of text to indicate an error occurred
            translatedTextElement.textContent = 'Translation unavailable. Please try again.';
            speakButton.disabled = true;
        })
        .finally(() => {
            // Hide loading indicator
            loadingElement.classList.add('hidden');
        });
    }, 500);
}

// Initialize speak button
document.addEventListener('DOMContentLoaded', () => {
    const speakButton = document.getElementById('speakButton');
    
    // Create error banner element if it doesn't exist
    let errorBanner = document.getElementById('errorBanner');
    if (!errorBanner) {
        errorBanner = document.createElement('div');
        errorBanner.id = 'errorBanner';
        errorBanner.className = 'hidden p-2 mt-2 mb-2 text-sm text-white bg-red-500 rounded';
        document.querySelector('.container').appendChild(errorBanner);
    }
    
    // Update loading indicator with better animation
    const loadingElement = document.getElementById('translationLoading');
    loadingElement.innerHTML = `
        <div class="flex items-center justify-center">
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-1"></div>
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-1" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-1" style="animation-delay: 0.4s"></div>
            <span class="ml-2">Translating medical text with Hugging Face...</span>
        </div>
    `;
    
    // Check if models are available and update dropdown
    fetch('/api/models')
        .then(response => response.json())
        .then(data => {
            const targetLanguageSelect = document.getElementById('targetLanguage');
            if (data.availableLanguages && data.availableLanguages.length > 0) {
                // Clear existing options
                targetLanguageSelect.innerHTML = '';
                
                // Add available languages from the API
                data.availableLanguages.forEach(lang => {
                    const option = document.createElement('option');
                    option.value = lang;
                    option.textContent = lang;
                    targetLanguageSelect.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Failed to load language models:', error));
    
    // Setup network status monitoring
    window.addEventListener('online', () => {
        if (errorBanner) errorBanner.classList.add('hidden');
    });
    
    window.addEventListener('offline', () => {
        if (errorBanner) {
            errorBanner.textContent = 'You are offline. Translation service unavailable.';
            errorBanner.classList.remove('hidden');
        }
    });
    
    speakButton.addEventListener('click', () => {
        const translatedText = document.getElementById('translatedText').textContent;
        const targetLanguageSelect = document.getElementById('targetLanguage');
        
        if (!translatedText || translatedText.includes('unavailable')) {
            return; // Don't attempt to speak if no translation
        }
        
        // Visual feedback when speaking starts
        speakButton.classList.add('animate-pulse');
        
        // Map language names to language codes for speech synthesis
        const languageMap = {
            'English': 'en-US',
            'Spanish': 'es-ES',
            'French': 'fr-FR',
            'German': 'de-DE',
            'Chinese': 'zh-CN',
            'Arabic': 'ar-SA',
            'Hindi': 'hi-IN'
        };
        
        const languageCode = languageMap[targetLanguageSelect.value] || 'en-US';
        
        if (translatedText) {
            const utterance = new SpeechSynthesisUtterance(translatedText);
            utterance.lang = languageCode;
            
            // Handle speech errors
            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event.error);
                if (errorBanner) {
                    errorBanner.textContent = 'Audio playback failed. Please try again.';
                    errorBanner.classList.remove('hidden');
                }
                speakButton.classList.remove('animate-pulse');
            };
            
            utterance.onend = () => {
                speakButton.classList.remove('animate-pulse');
            };
            
            window.speechSynthesis.speak(utterance);
        }
    });
    
    // Add retry button to error banner
    if (errorBanner && !errorBanner.querySelector('button')) {
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Retry';
        retryButton.className = 'ml-2 px-2 py-1 bg-white text-red-500 rounded text-xs font-bold';
        retryButton.onclick = () => {
            const text = document.getElementById('transcript').textContent;
            if (text.trim()) {
                translateText(text);
            }
            errorBanner.classList.add('hidden');
        };
        errorBanner.appendChild(retryButton);
    }
    
    // Add provider info to the app
    const header = document.querySelector('header p');
    if (header) {
        header.innerHTML += '<br><span class="text-sm text-blue-500">Powered by Hugging Face Translation Models</span>';
    }
});