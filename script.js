// Aktualisierte JavaScript-Datei mit Rückseitenkamera-Funktionalität und verbesserten OCR-Ergebnissen
const openStartScanDialog = () => {
    const startScanDialog = document.createElement('div');
    startScanDialog.id = 'startScanDialog';
    startScanDialog.style.position = 'fixed';
    startScanDialog.style.top = '50%';
    startScanDialog.style.left = '50%';
    startScanDialog.style.transform = 'translate(-50%, -50%)';
    startScanDialog.style.backgroundColor = 'white';
    startScanDialog.style.color = 'black';
    startScanDialog.style.padding = '20px';
    startScanDialog.style.border = '1px solid black';
    startScanDialog.style.zIndex = '1000';
    startScanDialog.style.textAlign = 'center';

    const message = document.createElement('h2');
    message.textContent = 'Möchten Sie den Scan starten?';

    const startButton = document.createElement('button');
    startButton.textContent = 'Ja';
    startButton.style.marginRight = '10px';
    startButton.onclick = () => {
        document.body.removeChild(startScanDialog);
        isScanning = true; // Setze den Status für die Erkennung

        startCamera();
    };

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Nein';
    cancelButton.onclick = () => {
        document.body.removeChild(startScanDialog);
        const goodbyeMessage = document.createElement('div');
        goodbyeMessage.id = 'goodbyeMessage';
        goodbyeMessage.style.position = 'fixed';
        goodbyeMessage.style.top = '50%';
        goodbyeMessage.style.left = '50%';
        goodbyeMessage.style.transform = 'translate(-50%, -50%)';
        goodbyeMessage.style.backgroundColor = 'white';
        goodbyeMessage.style.color = 'black';
        goodbyeMessage.style.padding = '20px';
        goodbyeMessage.style.border = '1px solid black';
        goodbyeMessage.style.zIndex = '1000';
        goodbyeMessage.style.textAlign = 'center';

        const goodbyeText = document.createElement('h2');
        goodbyeText.textContent = 'Auf Wiedersehen';

        goodbyeMessage.appendChild(goodbyeText);
        document.body.appendChild(goodbyeMessage);

        document.body.innerHTML = '';
        document.body.appendChild(goodbyeMessage);
    };

    startScanDialog.appendChild(message);
    startScanDialog.appendChild(startButton);
    startScanDialog.appendChild(cancelButton);
    document.body.appendChild(startScanDialog);
};

let intervalId; // Variable für die setInterval-ID

const startCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } }) // Rückseitenkamera priorisieren
        .then((stream) => {
            const video = document.getElementById('video');
            video.srcObject = stream;
            video.play();

            video.addEventListener('loadedmetadata', () => {
                console.log("Rückseitenkamera erfolgreich initialisiert.");
                startOCRProcess(video);
            });
        })
        .catch((err) => {
            console.warn("Rückseitenkamera nicht verfügbar. Wechsel zur Frontkamera.", err);
            // Fallback auf die Frontkamera
            return navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        })
        .then((stream) => {
            const video = document.getElementById('video');
            video.srcObject = stream;
            video.play();

            video.addEventListener('loadedmetadata', () => {
                console.log("Frontkamera erfolgreich initialisiert (Fallback).");
                startOCRProcess(video);
            });
        })
        .catch((err) => {
            console.error("Keine Kamera verfügbar:", err);
            alert("Bitte überprüfen Sie Ihre Kameraeinstellungen.");
        });
};

const startOCRProcess = (video) => {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    const analyzeFrame = () => {
        if (!isScanning) return;

        if (typeof Tesseract === 'undefined') {
            clearInterval(intervalId);
            console.error('Tesseract.js ist nicht definiert. Der OCR-Prozess wird gestoppt.');
            alert('Tesseract.js ist nicht verfügbar. Überprüfen Sie die Einbindung der Bibliothek.');
            return;
        }

        if (!video.videoWidth || !video.videoHeight) {
            console.warn("Das Videoelement liefert keine Frames.");
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Bildvorverarbeitung: Graustufen und Kontrast
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
            imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = avg; // Graustufen
        }
        context.putImageData(imageData, 0, 0);

        const processedImage = canvas.toDataURL('image/png');
        console.log("Frame erfasst, wird zur OCR-Analyse gesendet.");

        Tesseract.recognize(processedImage, 'eng')
            .then(({ data: { text } }) => {
                const detectedPlate = text.trim();
                console.log("OCR-Ergebnis:", detectedPlate);

                const isValidPlate = validPlates.some((plate) => isSimilar(plate, detectedPlate));

                if (isValidPlate) {
                    console.log("Gültiges Kennzeichen erkannt:", detectedPlate);
                    document.body.style.backgroundColor = 'green';
                    isScanning = false;
                    clearInterval(intervalId);
                    openStartScanDialog();
                } else {
                    console.log("Ungültiges Kennzeichen erkannt:", detectedPlate);
                    isScanning = false;
                    clearInterval(intervalId);
                    showErrorFeedback(`Ungültiges Kennzeichen erkannt: ${detectedPlate}`);
                }
            })
            .catch((err) => {
                console.error("Fehler bei der OCR-Analyse:", err);
            });
    };

    intervalId = setInterval(analyzeFrame, 2000); // Start der OCR-Schleife
};

const isSimilar = (plate1, plate2) => {
    const levenshtein = (a, b) => {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    };
    return levenshtein(plate1, plate2) <= 2;
};

const showErrorFeedback = (message) => {
    const errorDialog = document.createElement('div');
    errorDialog.id = 'errorDialog';
    errorDialog.style.position = 'fixed';
    errorDialog.style.top = '50%';
    errorDialog.style.left = '50%';
    errorDialog.style.transform = 'translate(-50%, -50%)';
    errorDialog.style.backgroundColor = 'white';
    errorDialog.style.color = 'black';
    errorDialog.style.padding = '20px';
    errorDialog.style.border = '1px solid black';
    errorDialog.style.zIndex = '1000';
    errorDialog.style.textAlign = 'center';

    const errorText = document.createElement('h2');
    errorText.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Schließen';
    closeButton.onclick = () => {
        document.body.removeChild(errorDialog);
        isScanning = true;
        intervalId = setInterval(analyzeFrame, 2000);
    };

    errorDialog.appendChild(errorText);
    errorDialog.appendChild(closeButton);
    document.body.appendChild(errorDialog);
};

let validPlates = [];
fetch('valid_plates.json')
    .then((response) => response.json())
    .then((data) => {
        validPlates = data;
    })
    .catch((error) => console.error('Fehler beim Laden der Liste:', error));

openStartScanDialog();