export default {
  translation: {
    title: "NeuroVirtual",
    subtitle: "Aufzeichnungssystem für neurologische Studien",
    patientData: "Patientendaten",
    name: "Vorname",
    lastName: "Nachname",
    identification: "Ausweisnummer",
    age: "Alter",
    studyType: "Studientyp",
    availableCameras: "Verfügbare Kameras",
    addCamera: "IP/RTSP-Kamera hinzufügen",
    add: "Hinzufügen",
    remove: "Entfernen",
    supportedFormats: "Unterstützte Formate: RTSP, HLS (.m3u8), HTTP/HTTPS (MJPEG, MP4)",
    startRecording: "Aufnahme starten",
    stopRecording: "Aufnahme stoppen",
    recordingInProgress: "Aufnahme läuft",
    recordingSaved: "Aufnahme gespeichert!",
    recordingsSaved: "Aufnahmen gespeichert!",
    newRecording: "Neue Aufnahme",
    patientInfo: "Patienteninformationen:",
    recordingDetails: "Aufnahmedetails:",
    folder: "Ordner:",
    duration: "Dauer:",
    date: "Datum:",
    years: "Jahre",
    cameras: "Kameras",
    camera: "Kamera",
    willRecord: "Es werden aufgenommen",
    simultaneously: "gleichzeitig",
    videoSaved: "Das Video wurde erfolgreich im Patientenordner gespeichert",
    videosSaved: "${count} Videos wurden erfolgreich im Patientenordner gespeichert",
    removeIpCamera: "IP-Kamera entfernen",
    placeholders: {
      patientName: "Vorname des Patienten",
      patientLastName: "Nachname des Patienten",
      documentNumber: "Dokumentnummer",
      ageYears: "Alter in Jahren",
      rtspUrl: "rtsp://localhost:8554/live"
    },
    studyTypes: {
      eeg: "Elektroenzephalogramm (EEG)",
      emg: "Elektromyographie (EMG)",
      sleep: "Schlafstudie (Polysomnographie)",
      evoked: "Evozierte Potenziale",
      mapping: "Gehirnkartierung"
    },
    alerts: {
      enterValidUrl: "Bitte geben Sie eine gültige URL ein",
      rtspWarning: "⚠️ RTSP-URLs erfordern eine Konvertierung zu HLS.\n\n1. Starten Sie den Backend-Server:\n   cd server\n   npm start\n\n2. Dann wird die RTSP-Kamera automatisch konvertiert.\n\nDrücken Sie OK, um fortzufahren."
    }
  }
};
