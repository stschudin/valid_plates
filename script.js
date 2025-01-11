
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const statusSpan = document.getElementById('status');
const detectedPlateSpan = document.getElementById('detected-plate');
const dialog = document.getElementById('dialog');
const formDialog = document.getElementById('formDialog');
const newScanDialog = document.getElementById('newScanDialog');
const alertDialog = document.getElementById('alertDialog');
const yesButton = document.getElementById('yesButton');
const noButton = document.getElementById('noButton');
const okButton = document.getElementById('okButton');
const saveButton = document.getElementById('saveButton');
const newScanButton = document.getElementById('newScanButton');
const emailInput = document.getElementById('email');
const fullNameInput = document.getElementById('fullName');
const licensePlateInput = document.getElementById('licensePlate');

const SPREADSHEET_ID = '1etsbtMkBMQFY6rJbL2d_20-8iatmq64oU6bajvGj29s';
const GOOGLE_SHEETS_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1:append?valueInputOption=USER_ENTERED`;
const API_KEY = 'AIzaSyDYenkUwFPBC_istj8LJAbNlBHFd7zwUgY';

let validPlates = [];
let currentPlate = '';
let isScanning = false; // Status, ob der Scan läuft

// Funktion zur Verbindungsprüfung
const checkGoogleSheetsConnection = () => {
    fetch(GOOGLE_SHEETS_API_URL, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${API_KEY}`,
        },
    })
    .then(response => {
        if (response.ok) {
            console.log('Verbindung zu Google Tabellen erfolgreich.');
            statusSpan.textContent = 'Verbindung zu Google Tabellen hergestellt.';
        } else {
            console.error('Verbindung zu Google Tabellen fehlgeschlagen:', response.statusText);
            statusSpan.textContent = 'Keine Verbindung zu Google Tabellen möglich.';
        }
    })
    .catch(error => {
        console.error('Fehler beim Verbinden zu Google Tabellen:', error);
        statusSpan.textContent = 'Fehler bei der Verbindung zu Google Tabellen.';
    });
};

// Lade erlaubte Kennzeichen
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

// Texterkennung
const analyzeFrame = () => {
  if (isScanning) return; // Verhindert mehrfaches Scannen
  isScanning = true;

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

// Abgleich
const checkLicensePlate = (plate) => {
  currentPlate = plate;

  if (!plate) {
    statusSpan.textContent = 'Kein Kennzeichen erkannt.';
    detectedPlateSpan.textContent = '';
    document.body.style.backgroundColor = 'black';
    isScanning = false;
    return;
  }

  detectedPlateSpan.textContent = plate;
  if (validPlates.includes(plate)) {
    document.body.style.backgroundColor = 'green';
    statusSpan.textContent = 'Berechtigt:';
    openNewScanDialog();
  } else {
    document.body.style.backgroundColor = 'red';
    statusSpan.textContent = 'Nicht berechtigt:';
    openConfirmationDialog();
  }
};

// Dialoge
const openConfirmationDialog = () => {
  dialog.classList.remove('hidden');

  yesButton.onclick = () => {
    dialog.classList.add('hidden');
    openFormDialog();
  };

  noButton.onclick = () => {
    dialog.classList.add('hidden');
    alertDialog.classList.remove('hidden');
  };
};

okButton.onclick = () => {
  alertDialog.classList.add('hidden');
  openNewScanDialog();
};

const openFormDialog = () => {
  formDialog.classList.remove('hidden');
  licensePlateInput.value = currentPlate;

  saveButton.onclick = () => {
    const email = emailInput.value;
    const fullName = fullNameInput.value;

    if (!email || !fullName) {
      alert('Bitte alle Felder ausfüllen.');
      return;
    }

    const data = { values: [[email, fullName, currentPlate]] };
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
        openNewScanDialog();
      })
      .catch((error) => console.error('Fehler beim Speichern:', error));
  };
};

const openNewScanDialog = () => {
  newScanDialog.classList.remove('hidden');
  newScanButton.onclick = () => {
    newScanDialog.classList.add('hidden');
    isScanning = false; // Scan wieder aktivieren
    analyzeFrame(); // Startet den Scan erneut
  };
};

// Rufe die Verbindungsprüfung auf
checkGoogleSheetsConnection();

// Starte den ersten Scan
analyzeFrame();
