let translateTimeout;
let conversationCount = 0;

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
        
        // Update conversation counter for UI
        conversationCount++;
        
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
        
        // Show loading indicator with medical-themed message
        loadingElement.innerHTML = `
            <div class="flex items-center justify-center">
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-1"></div>
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-1" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-1" style="animation-delay: 0.4s"></div>
                <span class="ml-2">Translating medical terminology...</span>
            </div>
        `;
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
            
            // Add conversation number indicator for context awareness
            const conversationLabel = document.createElement('div');
            conversationLabel.className = 'text-xs text-gray-500 mb-1';
            conversationLabel.textContent = `Translation #${conversationCount}`;
            
            // Clear previous content and add the label
            translatedTextElement.innerHTML = '';
            translatedTextElement.appendChild(conversationLabel);
            
            // Add the translated text
            const textNode = document.createElement('div');
            textNode.textContent = data.translatedText;
            translatedTextElement.appendChild(textNode);
            
            // Enable speak button
            speakButton.disabled = false;
            
            // Highlight potential medical terms in the translation
            highlightMedicalTerms(textNode);
            
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

// Function to highlight common medical terms or patterns
function highlightMedicalTerms(element) {
    // Skip if no element
    if (!element) return;
    
    // Common medical patterns to highlight
    const medicalPatterns = [
        // Dosage patterns
        /\b\d+(\.\d+)?\s*(mg|mcg|g|ml|cc|mEq|IU|units)\b/g,
        // Vital signs patterns
        /\b\d+\/\d+\s*mm\s*Hg\b/g, // Blood pressure
        /\b\d+(\.\d+)?\s*(°C|°F)\b/g, // Temperature
        // Time patterns for medication
        /\b(once|twice|three times|four times)\s+daily\b/gi,
        /\b(every|each)\s+\d+\s+(hours|days)\b/gi,
        /\bq\d+h\b/gi, // Medical abbreviation for timing
        // Lab value patterns
        /\b\d+(\.\d+)?\s*(mmol\/L|mg\/dL|ng\/mL)\b/g
    ];
    
    // Get the text content
    let html = element.textContent;
    
    // Apply highlighting to each pattern
    medicalPatterns.forEach(pattern => {
        html = html.replace(pattern, match => 
            `<span class="bg-yellow-100 px-1 rounded" title="Medical term">${match}</span>`
        );
    });
    
    // Update the element with highlighted content
    if (html !== element.textContent) {
        element.innerHTML = html;
    }
}

// Initialize speak button and other UI elements
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
    
    // Update loading indicator with medical-themed animation
    const loadingElement = document.getElementById('translationLoading');
    loadingElement.innerHTML = `
        <div class="flex items-center justify-center">
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-1"></div>
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-1" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-1" style="animation-delay: 0.4s"></div>
            <span class="ml-2">Translating medical terminology...</span>
        </div>
    `;
    
    // Add context indicator to the UI
    const translationContainer = document.getElementById('translatedText').parentNode;
    const contextIndicator = document.createElement('div');
    contextIndicator.id = 'contextIndicator';
    contextIndicator.className = 'text-xs text-gray-500 mt-1 mb-2';
    contextIndicator.innerHTML = '<span class="inline-flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Context-aware translation enabled</span>';
    translationContainer.insertBefore(contextIndicator, document.getElementById('translatedText'));
    
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
    
    // Add clear button functionality with context reset
    const clearButton = document.getElementById('clearButton');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            document.getElementById('transcript').textContent = '';
            document.getElementById('translatedText').textContent = '';
            document.getElementById('speakButton').disabled = true;
            
            // Reset conversation context on server
            fetch('/api/reset-context', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => {
                if (response.ok) {
                    // Reset local conversation counter
                    conversationCount = 0;
                    
                    // Flash context indicator to show reset
                    contextIndicator.classList.add('text-blue-500');
                    setTimeout(() => {
                        contextIndicator.classList.remove('text-blue-500');
                    }, 1000);
                }
            })
            .catch(error => {
                console.error('Failed to reset context:', error);
            });
        });
    }
    
    // Setup speak button
    speakButton.addEventListener('click', () => {
        const translatedText = document.getElementById('translatedText').textContent;
        const targetLanguageSelect = document.getElementById('targetLanguage');
        
        if (!translatedText || translatedText.includes('unavailable')) {
            return; // Don't attempt to speak if no translation
        }
        
        // Extract just the translated content (remove any UI elements text)
        const textToSpeak = translatedText.replace(/Translation #\d+/g, '').trim();
        
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
        
        if (textToSpeak) {
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
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
});