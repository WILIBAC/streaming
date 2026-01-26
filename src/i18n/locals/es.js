export default {
  translation: {
    title: "NeuroVirtual",
    subtitle: "Sistema de Grabación para Estudios Neurológicos",
    patientData: "Datos del Paciente",
    name: "Nombre",
    lastName: "Apellido",
    identification: "Identificación",
    age: "Edad",
    studyType: "Tipo de Estudio",
    availableCameras: "Cámaras Disponibles",
    addCamera: "Agregar Cámara IP/RTSP",
    add: "Agregar",
    remove: "Eliminar",
    supportedFormats: "Formatos soportados: RTSP, HLS (.m3u8), HTTP/HTTPS (MJPEG, MP4)",
    startRecording: "Iniciar Grabación",
    stopRecording: "Detener Grabación",
    recordingInProgress: "Grabación en Progreso",
    recordingSaved: "¡Grabación Guardada!",
    recordingsSaved: "¡Grabaciones Guardadas!",
    newRecording: "Nueva Grabación",
    patientInfo: "Información del Paciente:",
    recordingDetails: "Detalles de la Grabación:",
    folder: "Carpeta:",
    duration: "Duración:",
    date: "Fecha:",
    years: "años",
    cameras: "cámaras",
    camera: "cámara",
    willRecord: "Se grabarán",
    simultaneously: "simultáneamente",
    videoSaved: "El video ha sido guardado exitosamente en la carpeta del paciente",
    videosSaved: "Se han guardado ${count} videos exitosamente en la carpeta del paciente",
    removeIpCamera: "Eliminar cámara IP",
    placeholders: {
      patientName: "Nombres del paciente",
      patientLastName: "Apellidos del paciente",
      documentNumber: "Número de documento",
      ageYears: "Edad en años",
      rtspUrl: "rtsp://localhost:8554/live"
    },
    studyTypes: {
      eeg: "Electroencefalograma (EEG)",
      emg: "Electromiografía (EMG)",
      sleep: "Estudio de Sueño (Polisomnografía)",
      evoked: "Potenciales Evocados",
      mapping: "Mapeo Cerebral"
    },
    alerts: {
      enterValidUrl: "Por favor ingresa una URL válida",
      rtspWarning: "⚠️ URLs RTSP requieren conversión a HLS.\n\n1. Inicia el servidor backend:\n   cd server\n   npm start\n\n2. Luego la cámara RTSP se convertirá automáticamente.\n\nPresiona OK para continuar."
    }
  }
};
