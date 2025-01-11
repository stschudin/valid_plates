const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const statusSpan = document.getElementById('status');
const detectedPlateSpan = document.getElementById('detected-plate');
const dialog = document.getElementById('dialog');
const nameInput = document.getElementById('name');
const reasonInput = document.getElementById('reason');
const submitButton = document.getElementById('submitData');

const SPREADSHEET_ID = '1etsbtMkBMQFY6rJbL2d_20-8iatmq64oU6bajvGj29s';
const GOOGLE_SHEETS_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1:append?valueInputOption=USER_ENTERED`;
const API_KEY = 'AIzaSyDYenkUwFPBC_istj8LJAbNlBHFd7zwUgY';

let validPlates = [];

// Lade erlaubte Kennzeichen aus JSON
fetch('valid_plates.json')
  .then(response => response.json())
  .then(data => {
    validPlates = data;
  })
  .catch(error => console.error('Fehler beim Laden der Liste:', error));

// Zugriff auf die Kamera
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    console.error('Kamerazugriff verweigert:', err);
    statusSpan.textContent = 'Kamera konnte nicht gestartet werden.';
  });

// Texterkennung ausführen
const analyzeFrame = () => {
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = canvas.toDataURL('image/png');

  Tesseract.recognize(imageData, 'eng').then(({ data: { text } }) => {
    const detectedText = text.trim();
    checkLicensePlate(detectedText);
  });
};

// Abgleich mit erlaubten Kennzeichen
const checkLicensePlate = (plate) => {
  if (!plate) {
    statusSpan.textContent = 'Kein Kennzeichen erkannt.';
    detectedPlateSpan.textContent = '';
    document.body.style.backgroundColor = 'black';
    return;
  }

  if (validPlates.includes(plate)) {
    document.body.style.backgroundColor = 'green';
    statusSpan.textContent = 'Berechtigt:';
  } else {
    document.body.style.backgroundColor = 'red';
    statusSpan.textContent = 'Nicht berechtigt:';
    saveUnauthorizedPlate(plate); // Speichere nicht berechtigtes Kennzeichen
  }

  detectedPlateSpan.textContent = plate;
};

// Nicht berechtigtes Kennzeichen speichern und Dialog öffnen
const saveUnauthorizedPlate = (plate) => {
  dialog.classList.remove('hidden');

  submitButton.onclick = () => {
    const name = nameInput.value;
    const reason = reasonInput.value;

    const data = {
      values: [[plate, name, reason, new Date().toLocaleString()]],
    };

    fetch(GOOGLE_SHEETS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(data),
    })
      .then(() => {
        alert('Daten erfolgreich gespeichert!');
        dialog.classList.add('hidden');
        nameInput.value = '';
        reasonInput.value = '';
      })
      .catch((error) => {
        console.error('Fehler beim Speichern:', error);
      });
  };
};

// Wiederholtes Scannen (alle 2 Sekunden)
setInterval(analyzeFrame, 2000);
