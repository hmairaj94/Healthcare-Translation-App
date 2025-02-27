document.addEventListener('DOMContentLoaded', () => {
    const recordButton = document.getElementById('recordButton');
    const recordingStatus = document.getElementById('recordingStatus');
    const transcript = document.getElementById('transcript');
    const sourceLanguageSelect = document.getElementById('sourceLanguage');
    const connectionStatus = document.getElementById('connectionStatus');
    
    let recognition;
    let isRecording = false;
    let recognitionRestartAttempts = 0;
    const MAX_RESTART_ATTEMPTS = 3;
    let finalTranscriptText = ''; // Store the final transcript text
    
    // Initialize speech recognition
    const initSpeechRecognition = () => {
        window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (window.SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = sourceLanguageSelect.value;
            
            recognition.onstart = () => {
                recordingStatus.innerHTML = '<span class="inline-flex items-center"><span class="animate-pulse h-2 w-2 bg-red-500 rounded-full mr-2"></span>Listening...</span>';
                recordButton.classList.remove('bg-blue-500');
                recordButton.classList.add('bg-red-500');
                isRecording = true;
                recognitionRestartAttempts = 0;
            };
            
            recognition.onresult = (event) => {
                let interimTranscript = '';
                let newFinalTranscript = '';
                
                // Process results, distinguishing between interim and final
                for (let i = 0; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        newFinalTranscript += result[0].transcript + ' ';
                    } else {
                        interimTranscript += result[0].transcript;
                    }
                }
                
                // Update the final transcript text if we have new final results
                if (newFinalTranscript) {
                    finalTranscriptText += newFinalTranscript;
                    
                    // Trigger translation for final text
                    translateText(finalTranscriptText.trim());
                }
                
                // Update display with both final and interim text
                if (interimTranscript) {
                    // Show both final text and interim results
                    transcript.innerHTML = `${finalTranscriptText} <span class="text-gray-400 italic">${interimTranscript}</span>`;
                } else {
                    // Just show final text
                    transcript.textContent = finalTranscriptText;
                }
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                
                // Handle different error types
                switch(event.error) {
                    case 'network':
                        connectionStatus.textContent = 'Network error. Check your connection.';
                        connectionStatus.classList.remove('hidden');
                        break;
                    case 'not-allowed':
                    case 'service-not-allowed':
                        recordingStatus.innerHTML = '<span class="text-red-500">Microphone access denied</span>';
                        recordButton.disabled = true;
                        isRecording = false;
                        break;
                    case 'aborted':
                        // User or system aborted, just log it
                        console.log('Recognition aborted');
                        break;
                    case 'no-speech':
                        // No speech detected, just restart
                        break;
                    default:
                        recordingStatus.textContent = `Error: ${event.error}. Trying to recover...`;
                }
                
                // Attempt recovery for certain errors
                if (['error', 'network', 'no-speech'].includes(event.error)) {
                    attemptRecovery();
                } else {
                    stopRecording();
                }
            };
            
            recognition.onend = () => {
                // Only try to restart if we're still supposed to be recording
                if (isRecording) {
                    attemptRecovery();
                }
            };
        } else {
            recordingStatus.innerHTML = '<span class="text-red-500">Speech recognition not supported by your browser</span>';
            recordButton.disabled = true;
        }
    };
    
    const attemptRecovery = () => {
        if (isRecording && recognitionRestartAttempts < MAX_RESTART_ATTEMPTS) {
            recognitionRestartAttempts++;
            console.log(`Attempting to restart recognition (${recognitionRestartAttempts}/${MAX_RESTART_ATTEMPTS})`);
            
            // Show recovery attempt in UI
            recordingStatus.innerHTML = `<span class="text-yellow-600">Reconnecting... (${recognitionRestartAttempts}/${MAX_RESTART_ATTEMPTS})</span>`;
            
            // Small delay before restarting
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (err) {
                    console.error('Failed to restart recognition:', err);
                    
                    if (recognitionRestartAttempts >= MAX_RESTART_ATTEMPTS) {
                        stopRecording();
                        recordingStatus.innerHTML = '<span class="text-red-500">Failed to reconnect. Please try again.</span>';
                    } else {
                        // Try re-initializing
                        initSpeechRecognition();
                        setTimeout(() => {
                            try {
                                recognition.start();
                            } catch (innerErr) {
                                console.error('Second attempt failed:', innerErr);
                                stopRecording();
                            }
                        }, 1000);
                    }
                }
            }, 1000);
        } else if (recognitionRestartAttempts >= MAX_RESTART_ATTEMPTS) {
            stopRecording();
            recordingStatus.innerHTML = '<span class="text-red-500">Maximum reconnection attempts reached. Please try again.</span>';
        }
    };
    
    // Function to stop recording
    const stopRecording = () => {
        if (recognition) {
            try {
                recognition.stop();
            } catch (err) {
                console.error('Error stopping recognition:', err);
            }
        }
        
        recordingStatus.innerHTML = '<span>Click the microphone to start recording</span>';
        recordButton.classList.remove('bg-red-500');
        recordButton.classList.add('bg-blue-500');
        isRecording = false;
    };
    
    // Setup event listener for record button
    recordButton.addEventListener('click', () => {
        if (isRecording) {
            stopRecording();
        } else {
            // Clear transcript when starting new recording
            finalTranscriptText = '';
            transcript.textContent = '';
            
            // Initialize if not already done
            if (!recognition) {
                initSpeechRecognition();
            }
            
            // Update language in case it was changed
            if (recognition) {
                recognition.lang = sourceLanguageSelect.value;
            }
            
            try {
                recognition.start();
            } catch (err) {
                console.error('Error starting recognition:', err);
                recordingStatus.innerHTML = '<span class="text-red-500">Failed to start recording. Please try again.</span>';
            }
        }
    });
    
    // Handle language changes
    sourceLanguageSelect.addEventListener('change', () => {
        if (recognition) {
            // Update language for next recording session
            recognition.lang = sourceLanguageSelect.value;
            
            // If currently recording, restart with new language
            if (isRecording) {
                stopRecording();
                setTimeout(() => {
                    try {
                        recognition.start();
                    } catch (err) {
                        console.error('Error restarting with new language:', err);
                    }
                }, 300);
            }
        }
    });
    
    // Initialize on page load
    initSpeechRecognition();
    
    // Check for microphone permission on load
    navigator.permissions.query({name: 'microphone'}).then(permissionStatus => {
        const micIndicator = document.getElementById('micPermission');
        
        // Update indicator based on current permission state
        const updateMicIndicator = (state) => {
            if (state === 'granted') {
                micIndicator.classList.add('bg-green-500');
                micIndicator.classList.remove('bg-gray-300', 'bg-red-500');
            } else if (state === 'denied') {
                micIndicator.classList.add('bg-red-500');
                micIndicator.classList.remove('bg-gray-300', 'bg-green-500');
                recordButton.disabled = true;
                recordingStatus.innerHTML = '<span class="text-red-500">Microphone access denied</span>';
            } else {
                micIndicator.classList.add('bg-gray-300');
                micIndicator.classList.remove('bg-green-500', 'bg-red-500');
            }
        };
        
        updateMicIndicator(permissionStatus.state);
        
        // Listen for permission changes
        permissionStatus.onchange = () => {
            updateMicIndicator(permissionStatus.state);
        };
    });
    
    // Add clear button functionality
    const clearButton = document.getElementById('clearButton');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            transcript.textContent = '';
            finalTranscriptText = '';
            document.getElementById('translatedText').textContent = '';
            document.getElementById('speakButton').disabled = true;
        });
    }
    
    // Handle page visibility changes to manage recognition state
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && isRecording) {
            // Pause recording when page is not visible
            stopRecording();
        }
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (isRecording) {
            stopRecording();
        }
    });
});