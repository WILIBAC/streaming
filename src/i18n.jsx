import React, { createContext, useContext, useState, useEffect } from 'react';

// Traducciones
const translations = {
  es: {
    title: "NeuroVirtual",
    subtitle: "Sistema de Grabacion para Estudios Neurologicos",
    patientData: "Datos del Paciente",
    name: "Nombre",
    lastName: "Apellido",
    fullName: "Nombre Completo",
    identification: "Identificacion",
    age: "Edad",
    recordingDuration: "Límite de Tiempo",
    noLimit: "Sin límite (Manual)",
    hour: "hora",
    hours: "horas",
    minutes: "minutos",
    studyType: "Tipo de Estudio",
    availableCameras: "Camaras Disponibles",
    addCamera: "Agregar Camara IP/RTSP",
    add: "Agregar",
    supportedFormats: "Formatos soportados: RTSP, HLS (.m3u8), HTTP/HTTPS (MJPEG, MP4)",
    startRecording: "Iniciar Grabacion",
    stopRecording: "Detener Grabacion",
    recordingInProgress: "Grabacion en Progreso",
    recordingSaved: "Grabacion Guardada!",
    recordingsSaved: "Grabaciones Guardadas!",
    newRecording: "Nueva Grabacion",
    patientInfo: "Informacion del Paciente:",
    recordingDetails: "Detalles de la Grabacion:",
    folder: "Carpeta:",
    duration: "Duracion:",
    date: "Fecha:",
    years: "anos",
    cameras: "camaras",
    camera: "camara",
    willRecord: "Se grabaran",
    simultaneously: "simultaneamente",
    videoSaved: "El video ha sido guardado exitosamente en la carpeta del paciente",
    removeIpCamera: "Eliminar camara IP",
    loadingCameras: "Cargando camaras...",
    errorStartingRecording: "Error al iniciar grabacion",
    videosSaved: "videos han sido guardados exitosamente en la carpeta del paciente",
    placeholders: {
      patientName: "Nombres del paciente",
      patientLastName: "Apellidos del paciente",
      documentNumber: "Numero de documento",
      ageYears: "Edad en anos",
      rtspUrl: "rtsp://localhost:8554/live"
    },
    studyTypes: {
      eeg: "Electroencefalograma (EEG)",
      emg: "Electromiografia (EMG)",
      sleep: "Estudio de Sueno (Polisomnografia)",
      evoked: "Potenciales Evocados",
      mapping: "Mapeo Cerebral"
    },
    alerts: {
      enterValidUrl: "Por favor ingresa una URL valida",
      rtspWarning: "URLs RTSP requieren conversion a HLS.\n\n1. Inicia el servidor backend:\n   cd server\n   npm start\n\n2. Luego la camara RTSP se convertira automaticamente.\n\nPresiona OK para continuar."
    }
  },
  en: {
    title: "NeuroVirtual",
    subtitle: "Recording System for Neurological Studies",
    patientData: "Patient Data",
    name: "First Name",
    lastName: "Last Name",
    fullName: "Full Name",
    identification: "ID Number",
    age: "Age",
    recordingDuration: "Time Limit",
    noLimit: "No limit (Manual)",
    hour: "hour",
    hours: "hours",
    minutes: "minutes",
    studyType: "Study Type",
    availableCameras: "Available Cameras",
    addCamera: "Add IP/RTSP Camera",
    add: "Add",
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
    videoSaved: "videos have been successfully saved in the patient folder",
    removeIpCamera: "Remove IP camera",
    loadingCameras: "Loading cameras...",
    errorStartingRecording: "Error starting recording",
    videoSaved: "The video has been successfully saved in the patient folder",
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
      rtspWarning: "RTSP URLs require conversion to HLS.\n\n1. Start the backend server:\n   cd server\n   npm start\n\n2. Then the RTSP camera will be automatically converted.\n\nPress OK to continue."
    }
  },
  pt: {
    title: "NeuroVirtual",
    subtitle: "Sistema de Gravacao para Estudos Neurologicos",
    patientData: "Dados do Paciente",
    name: "Nome",
    lastName: "Sobrenome",
    fullName: "Nome Completo",
    identification: "Identificacao",
    age: "Idade",
    recordingDuration: "Limite de Tempo",
    noLimit: "Sem limite (Manual)",
    hour: "hora",
    hours: "horas",
    minutes: "minutos",
    studyType: "Tipo de Estudo",
    availableCameras: "Cameras Disponiveis",
    addCamera: "Adicionar Camera IP/RTSP",
    add: "Adicionar",
    supportedFormats: "Formatos suportados: RTSP, HLS (.m3u8), HTTP/HTTPS (MJPEG, MP4)",
    startRecording: "Iniciar Gravacao",
    stopRecording: "Parar Gravacao",
    recordingInProgress: "Gravacao em Andamento",
    recordingSaved: "Gravacao Salva!",
    recordingsSaved: "Gravacoes Salvas!",
    newRecording: "Nova Gravacao",
    patientInfo: "Informacoes do Paciente:",
    recordingDetails: "Detalhes da Gravacao:",
    folder: "Pasta:",
    duration: "Duracao:",
    date: "Data:",
    years: "anos",
    cameras: "cameras",
    camera: "camera",
    willRecord: "Serao gravadas",
    simultaneously: "simultaneamente",
    videoSaved: "O video foi salvo com sucesso na pasta do paciente",
    removeIpCamera: "Remover camera IP",
    loadingCameras: "Carregando cameras...",
    errorStartingRecording: "Erro ao iniciar gravacao",
    videosSaved: "videos foram salvos com sucesso na pasta do paciente",
    placeholders: {
      patientName: "Nome do paciente",
      patientLastName: "Sobrenome do paciente",
      documentNumber: "Numero do documento",
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
      enterValidUrl: "Por favor, insira uma URL valida",
      rtspWarning: "URLs RTSP requerem conversao para HLS.\n\n1. Inicie o servidor backend:\n   cd server\n   npm start\n\n2. Em seguida, a camera RTSP sera convertida automaticamente.\n\nPressione OK para continuar."
    }
  }
};

// Crear el contexto
const LanguageContext = createContext();

// Función para detectar el idioma del navegador
const detectBrowserLanguage = () => {
  // Obtener todos los idiomas del navegador
  const browserLangs = navigator.languages || [navigator.language || navigator.userLanguage];
  
  console.log('🌐 Idiomas del navegador:', browserLangs);
  
  // Idiomas soportados
  const supportedLangs = ['es', 'en', 'pt'];
  
  // Buscar el primer idioma soportado
  for (const lang of browserLangs) {
    const langCode = lang.split('-')[0].toLowerCase();
    console.log('🔍 Verificando idioma:', lang, '→', langCode);
    
    if (supportedLangs.includes(langCode)) {
      console.log('✅ Idioma detectado:', langCode);
      return langCode;
    }
  }
  
  console.log('⚠️ No se detectó idioma soportado, usando español por defecto');
  return 'es';
};

// Provider del contexto
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Siempre detectar del navegador al iniciar
    const detected = detectBrowserLanguage();
    console.log('🎯 Idioma inicial detectado:', detected);
    return detected;
  });

  useEffect(() => {
    // Detectar cambios en el idioma del navegador
    const handleLanguageChange = () => {
      const newLang = detectBrowserLanguage();
      console.log('🔄 Cambio de idioma detectado:', newLang);
      if (newLang !== language) {
        setLanguage(newLang);
      }
    };

    // Escuchar cambios de idioma
    window.addEventListener('languagechange', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
    };
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook para usar el contexto
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Export por defecto para compatibilidad
export default { LanguageProvider, useLanguage };
