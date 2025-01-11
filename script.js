// Aktualisierte JavaScript-Datei mit erweiterten Debugging-Informationen und gerätebasierter Kameraauswahl
const startCamera = () => {
    navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
            const videoDevices = devices.filter((device) => device.kind === 'videoinput');
            if (videoDevices.length === 0) {
                console.error("Keine Kameras verfügbar.");
                alert("Keine Kameras verfügbar. Bitte überprüfen Sie Ihre Kameraeinstellungen.");
                return;
            }

            console.log("Gefundene Kameras:", videoDevices.map((device) => ({ label: device.label, deviceId: device.deviceId })));

            const rearCamera = videoDevices.find((device) => device.label.toLowerCase().includes('back'));
            if (rearCamera) {
                console.log("Rückseitenkamera ausgewählt:", rearCamera.label);
                return navigator.mediaDevices.getUserMedia({ video: { deviceId: rearCamera.deviceId } });
            } else {
                console.warn("Keine Rückseitenkamera gefunden. Verwende erste verfügbare Kamera.");
                return navigator.mediaDevices.getUserMedia({ video: { deviceId: videoDevices[0].deviceId } });
            }
        })
        .then((stream) => {
            const video = document.getElementById('video');
            video.srcObject = stream;
            video.play();

            video.addEventListener('loadedmetadata', () => {
                console.log("Kamera erfolgreich initialisiert: Maße:", video.videoWidth, video.videoHeight);
                startOCRProcess(video);
            });
        })
        .catch((err) => {
            console.error("Fehler beim Starten der Kamera:", err);
            alert("Bitte überprüfen Sie Ihre Kameraeinstellungen. Es konnte keine Kamera gestartet werden.");
        });
};
