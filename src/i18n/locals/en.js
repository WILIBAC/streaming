export default {
  translation: {
    title: "NeuroVirtual",
    subtitle: "Recording System for Neurological Studies",
    patientData: "Patient Data",
    name: "First Name",
    lastName: "Last Name",
    identification: "ID Number",
    age: "Age",
    studyType: "Study Type",
    availableCameras: "Available Cameras",
    addCamera: "Add IP/RTSP Camera",
    add: "Add",
    remove: "Remove",
    supportedFormats: "Supported formats: RTSP, HLS (.m3u8), HTTP/HTTPS (MJPEG, MP4)",
    startRecording: "Start Recording",
    stopRecording: "Stop Recording",
    recordingInProgress: "Recording in Progress",
    recordingSaved: "Recording Saved!",
    recordingsSaved: "Recordings Saved!",
    newRecording: "New Recording",
    patientInfo: "Patient Information:",
    recordingDetails: "Recording Details:",
    folder: "Folder:",
    duration: "Duration:",
    date: "Date:",
    years: "years",
    cameras: "cameras",
    camera: "camera",
    willRecord: "Will record",
    simultaneously: "simultaneously",
    videoSaved: "The video has been successfully saved in the patient folder",
    videosSaved: "${count} videos have been successfully saved in the patient folder",
    removeIpCamera: "Remove IP camera",
    placeholders: {
      patientName: "Patient's first name",
      patientLastName: "Patient's last name",
      documentNumber: "Document number",
      ageYears: "Age in years",
      rtspUrl: "rtsp://localhost:8554/live"
    },
    studyTypes: {
      eeg: "Electroencephalogram (EEG)",
      emg: "Electromyography (EMG)",
      sleep: "Sleep Study (Polysomnography)",
      evoked: "Evoked Potentials",
      mapping: "Brain Mapping"
    },
    alerts: {
      enterValidUrl: "Please enter a valid URL",
      rtspWarning: "⚠️ RTSP URLs require conversion to HLS.\n\n1. Start the backend server:\n   cd server\n   npm start\n\n2. Then the RTSP camera will be automatically converted.\n\nPress OK to continue."
    }
  }
};
