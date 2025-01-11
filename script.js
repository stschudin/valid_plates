// Neue Abfrage-Dialog-Funktion mit Ja/Nein-Buttons
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

        // Starte den Kamerazugriff mit Fallback
        startCameraWithFallback();
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

        // Blockiere die PWA durch Entfernen der Benutzeroberfläche
        document.body.innerHTML = '';
        document.body.appendChild(goodbyeMessage);
    };

    startScanDialog.appendChild(message);
    startScanDialog.appendChild(startButton);
    startScanDialog.appendChild(cancelButton);
    document.body.appendChild(startScanDialog);
};

// Funktion, um die Kamera zu starten, mit Rückfall auf Frontkamera
const startCameraWithFallback = () => {
    navigator.mediaDevices
        .getUserMedia({ video: { facingMode: { exact: "environment" } } })
        .then((stream) => startCameraStream(stream))
        .catch(() => {
            console.warn("Rückseitenkamera nicht verfügbar. Wechsle zur Frontkamera.");
            return navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        })
        .then((stream) => startCameraStream(stream))
        .catch((err) => {
            console.error("Kamerazugriff verweigert:", err);
            alert("Kamera konnte nicht gestartet werden.");
        });
};

// Funktion, um den Kamerastream zu starten
const startCameraStream = (stream) => {
    const video = document.getElementById('video');
    video.srcObject = stream;
    video.play();

    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    const analyzeFrame = () => {
        if (!isScanning) return; // Verhindert mehrfaches Scannen

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Bildvorverarbeitung: Schärfen und Kontrastverstärkung (optional erweiterbar)
        const imageData = canvas.toDataURL('image/png');

        // OCR-Prozess mit Tesseract.js simulieren (Tesseract.js muss korrekt eingebunden sein)
        Tesseract.recognize(imageData, 'eng').then(({ data: { text } }) => {
            const detectedPlate = text.trim();

            // Fuzzy-Matching zur Validierung
            const isValidPlate = validPlates.some((plate) => isSimilar(plate, detectedPlate));

            if (isValidPlate) {
                document.body.style.backgroundColor = 'green';
                openStartScanDialog(); // Dialog erneut öffnen
            } else {
                document.body.style.backgroundColor = 'red';
                showErrorFeedback("Kennzeichen nicht erkannt oder ungültig.");
            }
        });
    };

    // Starte den OCR-Scan zyklisch
    setInterval(analyzeFrame, 1000);
};

// Fuzzy-Matching-Funktion
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
    return levenshtein(plate1, plate2) <= 2; // Toleranz von 2 Zeichenabweichungen
};

// Fehler-Feedback anzeigen
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
    };

    errorDialog.appendChild(errorText);
    errorDialog.appendChild(closeButton);
    document.body.appendChild(errorDialog);
};

// Lade erlaubte Kennzeichen aus valid_plates.json
let validPlates = [];
fetch('valid_plates.json')
    .then((response) => response.json())
    .then((data) => {
        validPlates = data;
    })
    .catch((error) => console.error('Fehler beim Laden der Liste:', error));

// Rufe die neue Funktion anstelle der Verbindung zu Google Sheets auf
openStartScanDialog();
