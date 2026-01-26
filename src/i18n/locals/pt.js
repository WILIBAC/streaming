export default {
  translation: {
    title: "NeuroVirtual",
    subtitle: "Sistema de Gravação para Estudos Neurológicos",
    patientData: "Dados do Paciente",
    name: "Nome",
    lastName: "Sobrenome",
    identification: "Identificação",
    age: "Idade",
    studyType: "Tipo de Estudo",
    availableCameras: "Câmeras Disponíveis",
    addCamera: "Adicionar Câmera IP/RTSP",
    add: "Adicionar",
    remove: "Remover",
    supportedFormats: "Formatos suportados: RTSP, HLS (.m3u8), HTTP/HTTPS (MJPEG, MP4)",
    startRecording: "Iniciar Gravação",
    stopRecording: "Parar Gravação",
    recordingInProgress: "Gravação em Andamento",
    recordingSaved: "Gravação Salva!",
    recordingsSaved: "Gravações Salvas!",
    newRecording: "Nova Gravação",
    patientInfo: "Informações do Paciente:",
    recordingDetails: "Detalhes da Gravação:",
    folder: "Pasta:",
    duration: "Duração:",
    date: "Data:",
    years: "anos",
    cameras: "câmeras",
    camera: "câmera",
    willRecord: "Serão gravadas",
    simultaneously: "simultaneamente",
    videoSaved: "O vídeo foi salvo com sucesso na pasta do paciente",
    videosSaved: "${count} vídeos foram salvos com sucesso na pasta do paciente",
    removeIpCamera: "Remover câmera IP",
    placeholders: {
      patientName: "Nome do paciente",
      patientLastName: "Sobrenome do paciente",
      documentNumber: "Número do documento",
      ageYears: "Idade em anos",
      rtspUrl: "rtsp://localhost:8554/live"
    },
    studyTypes: {
      eeg: "Eletroencefalograma (EEG)",
      emg: "Eletromiografia (EMG)",
      sleep: "Estudo do Sono (Polissonografia)",
      evoked: "Potenciais Evocados",
      mapping: "Mapeamento Cerebral"
    },
    alerts: {
      enterValidUrl: "Por favor, insira uma URL válida",
      rtspWarning: "⚠️ URLs RTSP requerem conversão para HLS.\n\n1. Inicie o servidor backend:\n   cd server\n   npm start\n\n2. Em seguida, a câmera RTSP será convertida automaticamente.\n\nPressione OK para continuar."
    }
  }
};
