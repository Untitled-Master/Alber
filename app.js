// Check if SpeechRecognition API is supported
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!window.SpeechRecognition) {
    alert("Your browser does not support Speech Recognition. Try Chrome or Edge.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // Set language
    recognition.interimResults = true;
    recognition.continuous = true;

    const startButton = document.getElementById("start-btn");
    const stopButton = document.getElementById("stop-btn");
    const transcriptDiv = document.getElementById("transcript");
    const responseDiv = document.getElementById("response");

    let isListening = false;

    // Toggle between start and stop listening on button click
    startButton.addEventListener("click", () => {
        if (isListening) {
            recognition.stop();
            startButton.textContent = "Start Listening";
            stopButton.style.display = "none";
        } else {
            recognition.start();
            startButton.textContent = "Listening...";
            stopButton.style.display = "inline-block";
        }
        isListening = !isListening;
    });

    stopButton.addEventListener("click", () => {
        recognition.stop();
        startButton.textContent = "Start Listening";
        stopButton.style.display = "none";
        sendToAPI(transcriptDiv.textContent); // Start the AI request after stopping listening
    });

    // When speech recognition results are returned
    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0]) // Get the first result from each set of results
            .map(result => result.transcript) // Extract the transcript text
            .join(''); // Join all results to form the full transcript
        transcriptDiv.textContent = transcript; // Update the display with the recognized speech

        // Check if the word "jover" is spoken
        if (transcript.toLowerCase().includes("jover")) {
            recognition.stop();  // Stop listening
            startButton.textContent = "Start Listening";
            stopButton.style.display = "none";
            sendToAPI(transcript); // Trigger the API request when "jover" is detected
        }
    };

    // Handle any errors in speech recognition
    recognition.onerror = (event) => {
        console.error("Speech recognition error detected: ", event.error);
    };

    // Restart recognition if it ends unexpectedly
    recognition.onend = () => {
        if (isListening) recognition.start(); // Restart if still listening
    };

    // Function to send the recognized text to the API and display the response
    const sendToAPI = async (text) => {
        try {
            // Set up the API request to send the recognized speech (text)
            const response = await fetch('https://nexra.aryahcr.cc/api/chat/gpt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [
                        { role: "assistant", content: "Hello! How are you today?" },
                        { role: "user", content: "Hello, my name is Ahmed Belmehnouf. I made you, and you are an AI bot called Albert" },
                        { role: "assistant", content: "Hello, Ahmed! How are you today?" }
                    ],
                    prompt: text, // Using the speech-to-text output as the prompt
                    model: "GPT-4",
                    markdown: false
                })
            });

            const result = await response.json();
            let id = result.id;

            // Polling for the result from the API
            let data = true;
            let isResponseLogged = false; // Flag to track if the response has been logged

            while (data) {
                // Waiting for the API task to complete or return an error
                const statusResponse = await fetch(`https://nexra.aryahcr.cc/api/chat/task/${encodeURIComponent(id)}`);
                const statusData = await statusResponse.json();

                console.log(statusData); // Log response for debugging

                switch (statusData.status) {
                    case "pending":
                        data = true;
                        break;
                    case "error":
                    case "not_found":
                        data = false;
                        break;
                    case "completed":
                        if (!isResponseLogged) {
                            responseDiv.textContent = statusData.gpt; // Update the div with the response
                            isResponseLogged = true;

                            // Call the function to read the AI response aloud
                            speakText();

                            data = false; // Stop polling once task is completed
                        }
                        break;
                }
            }
        } catch (error) {
            console.error('Error:', error);
            responseDiv.textContent = "Error occurred while fetching API response.";
        }
    };

    // Function to read the AI response using SpeechSynthesis
    const speakText = () => {
        const responseText = responseDiv.textContent;
        const speech = new SpeechSynthesisUtterance(responseText); // Create a speech utterance
        speech.lang = 'en-US'; // Set language
        speech.volume = 1; // Volume (0 to 1)
        speech.rate = 1; // Speed of speech (normal rate)
        speech.pitch = 1; // Pitch (normal pitch)

        // Get the list of available voices
        const voices = window.speechSynthesis.getVoices();
        // Find the first available female voice
        const femaleVoice = voices.find(voice => voice.name.toLowerCase().includes('female'));

        if (femaleVoice) {
            speech.voice = femaleVoice; // Set the voice to a female voice
        }

        // Speak the text
        window.speechSynthesis.speak(speech);
    };
}
