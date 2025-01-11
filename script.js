
// const SPREADSHEET_ID = '1etsbtMkBMQFY6rJbL2d_20-8iatmq64oU6bajvGj29s';
// const GOOGLE_SHEETS_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1:append?valueInputOption=USER_ENTERED`;
// const API_KEY = 'AIzaSyDYenkUwFPBC_istj8LJAbNlBHFd7zwUgY';

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const statusSpan = document.getElementById('status');
const detectedPlateSpan = document.getElementById('detected-plate');
const dialog = document.getElementById('dialog');
const formDialog = document.getElementById('formDialog');
const alertDialog = document.getElementById('alertDialog');
const yesButton = document.getElementById('yesButton');
const noButton = document.getElementById('noButton');
const okButton = document.getElementById('okButton');
const saveButton = document.getElementById('saveButton');
const emailInput = document.getElementById('email');
const fullNameInput = document.getElementById('fullName');
const licensePlateInput = document.getElementById('licensePlate');

const SPREADSHEET_ID = 1etsbtMkBMQFY6rJbL2d_20-8iatmq64oU6bajvGj29s;
const GOOGLE_SHEETS_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1:append?valueInputOption=USER_ENTERED`;
const API_KEY = AIzaSyDYenkUwFPBC_istj8LJAbNlBHFd7zwUgY;

let validPlates = [];
let currentPlate = ''; // Speichert das aktuell erkannte Kennzeichen

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

  currentPlate = plate; // Speichere das aktuell erkannte Kennzeichen

  if (validPlates.includes(plate)) {
    document.body.style.backgroundColor = 'green';
    statusSpan.textContent = 'Berechtigt:';
  } else {
    document.body.style.backgroundColor = 'red';
    statusSpan.textContent = 'Nicht berechtigt:';
    openConfirmationDialog(); // Öffne die Abfrage
  }

  detectedPlateSpan.textContent = plate;
};

// Öffne die Abfrage
const openConfirmationDialog = () => {
  dialog.classList.remove('hidden');

  // "Ja"-Button: Öffne das Formular
  yesButton.onclick = () => {
    dialog.classList.add('hidden');
    openFormDialog();
  };

  // "Nein"-Button: Zeige die Meldung
  noButton.onclick = () => {
    dialog.classList.add('hidden');
    alertDialog.classList.remove('hidden');
  };
};

// Schließe die Meldung
okButton.onclick = () => {
  alertDialog.classList.add('hidden');
};

// Öffne das Formular
const openFormDialog = () => {
  formDialog.classList.remove('hidden');
  licensePlateInput.value = currentPlate; // Kennzeichen ins Formular einfügen

  saveButton.onclick = () => {
    const email = emailInput.value;
    const fullName = fullNameInput.value;

    if (!email || !fullName) {
      alert('Bitte alle Felder ausfüllen.');
      return;
    }

    // Daten an Google Sheets senden
    const data = {
      values: [[email, fullName, currentPlate]],
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
        formDialog.classList.add('hidden');
        emailInput.value = '';
        fullNameInput.value = '';
      })
      .catch((error) => {
        console.error('Fehler beim Speichern:', error);
      });
  };
};

// Wiederholtes Scannen (alle 2 Sekunden)
setInterval(analyzeFrame, 2000);
