
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

        // Starte den Kamerazugriff und den OCR-Prozess
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
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
                  const imageData = canvas.toDataURL('image/png');

                  // OCR-Prozess mit Tesseract.js simulieren (Tesseract.js muss korrekt eingebunden sein)
                  Tesseract.recognize(imageData, 'eng').then(({ data: { text } }) => {
                      const detectedPlate = text.trim();

                      if (validPlates.includes(detectedPlate)) {
                          document.body.style.backgroundColor = 'green';
                          openStartScanDialog(); // Dialog erneut öffnen
                      } else {
                          document.body.style.backgroundColor = 'red';
                      }
                  });
              };

              // Starte den OCR-Scan zyklisch
              setInterval(analyzeFrame, 1000);
          })
          .catch((err) => {
              console.error('Kamerazugriff verweigert:', err);
              alert('Kamera konnte nicht gestartet werden.');
          });
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

// Lade erlaubte Kennzeichen aus valid_plates.json
let validPlates = [];
fetch('valid_plates.json')
  .then(response => response.json())
  .then(data => {
      validPlates = data;
  })
  .catch(error => console.error('Fehler beim Laden der Liste:', error));

// Rufe die neue Funktion anstelle der Verbindung zu Google Sheets auf
openStartScanDialog();
