
const videoElement = document.getElementById("video");
const cameraSelect = document.getElementById("cameraSelect");
const startCameraButton = document.getElementById("startCamera");

// Funktion, um verfügbare Kameras aufzulisten
async function listCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === "videoinput");

    videoDevices.forEach((device, index) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text = device.label || `Kamera ${index + 1}`;
      cameraSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Fehler beim Abrufen der Kameras:", error);
  }
}

// Funktion, um eine ausgewählte Kamera zu aktivieren
async function activateCamera(deviceId) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
    });
    videoElement.srcObject = stream;
    videoElement.style.display = "block"; // Video-Element sichtbar machen
  } catch (error) {
    console.error("Kamera konnte nicht aktiviert werden:", error);
  }
}

// Ereignislistener für den Kamera-Start-Button
startCameraButton.addEventListener("click", () => {
  const selectedCameraId = cameraSelect.value;
  if (selectedCameraId) {
    activateCamera(selectedCameraId);
  } else {
    alert("Bitte wählen Sie eine Kamera aus.");
  }
});

// Kameras initial laden
listCameras();
