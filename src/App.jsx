import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, User, FileText, Save, StopCircle, Clock } from 'lucide-react';
import Hls from 'hls.js';
import { useLanguage } from './i18n';

function App() {
  const { t } = useLanguage();
  const [step, setStep] = useState('form');
  const [patientData, setPatientData] = useState({
    nombre: '',
    apellido: '',
    identificacion: '',
    edad: '',
    tipoEstudio: 'EEG'
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameras, setSelectedCameras] = useState([]);
  const [ipCameraUrl, setIpCameraUrl] = useState('');
  const [ipCameras, setIpCameras] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState(0); // 0 = Sin límite
  
  const videoRefs = useRef({});
  const mediaRecordersRef = useRef({});
  const streamsRef = useRef({});
  const timerRef = useRef(null);

  const handleInputChange = (e) => {
    setPatientData({
      ...patientData,
      [e.target.name]: e.target.value
    });
  };

  const loadAvailableCameras = async () => {
    try {
      // Intentar enumerar dispositivos sin pedir permiso primero
      let devices = await navigator.mediaDevices.enumerateDevices();
      let videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Si los dispositivos no tienen labels, necesitamos pedir permiso
      if (videoDevices.length > 0 && !videoDevices[0].label) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          tempStream.getTracks().forEach(track => track.stop());
          
          // Volver a enumerar después de obtener permiso
          devices = await navigator.mediaDevices.enumerateDevices();
          videoDevices = devices.filter(device => device.kind === 'videoinput');
        } catch (permErr) {
          console.warn('No se pudo acceder a la cámara (puede estar en uso):', permErr);
          // Continuar de todos modos con los dispositivos detectados
        }
      }
      
      setAvailableCameras(videoDevices);
      
      if (videoDevices.length > 0 && selectedCameras.length === 0) {
        setSelectedCameras([videoDevices[0].deviceId]);
      }
    } catch (err) {
      console.error('Error al enumerar dispositivos:', err);
      // No mostrar alert agresivo, solo log en consola
    }
  };

  const toggleCameraSelection = (deviceId) => {
    if (selectedCameras.includes(deviceId)) {
      setSelectedCameras(selectedCameras.filter(id => id !== deviceId));
    } else {
      setSelectedCameras([...selectedCameras, deviceId]);
    }
  };

  const addIpCamera = () => {
    if (!ipCameraUrl.trim()) {
      alert(t('alerts.enterValidUrl'));
      return;
    }

    // Detectar si es RTSP
    if (ipCameraUrl.toLowerCase().startsWith('rtsp://')) {
      alert(t('alerts.rtspWarning'));
    }

    const ipCameraId = `ip_camera_${Date.now()}`;
    const newIpCamera = {
      deviceId: ipCameraId,
      label: `${t('addCamera')}: ${ipCameraUrl}`,
      url: ipCameraUrl,
      kind: 'ipcamera',
      isRtsp: ipCameraUrl.toLowerCase().startsWith('rtsp://')
    };

    setIpCameras([...ipCameras, newIpCamera]);
    setSelectedCameras([...selectedCameras, ipCameraId]);
    setIpCameraUrl('');
  };

  const removeIpCamera = (deviceId) => {
    setIpCameras(ipCameras.filter(cam => cam.deviceId !== deviceId));
    setSelectedCameras(selectedCameras.filter(id => id !== deviceId));
  };

  const startStreaming = async () => {
    try {
      setStep('streaming');
      const recordings = {};
      
      for (const deviceId of selectedCameras) {
        const ipCamera = ipCameras.find(cam => cam.deviceId === deviceId);
        
        if (ipCamera) {
          // Manejar cámara IP/RTSP
          if (ipCamera.isRtsp) {
            // Convertir RTSP a HLS usando el servidor backend
            try {
              const response = await fetch('http://localhost:3001/api/start-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  rtspUrl: ipCamera.url,
                  streamId: deviceId,
                  patientData: patientData
                })
              });

              const data = await response.json();
              if (!data.success) {
                throw new Error('Error al iniciar stream RTSP: ' + data.error);
              }

              // Usar la URL HLS generada con hls.js
              const video = document.createElement('video');
              video.crossOrigin = 'anonymous';
              video.autoplay = true;
              video.muted = true;
              
              await new Promise((resolve, reject) => {
                if (Hls.isSupported()) {
                  const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                  });
                  hls.loadSource(data.hlsUrl);
                  hls.attachMedia(video);
                  
                  hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('✅ HLS manifest cargado:', data.hlsUrl);
                    // Esperar a que el video tenga datos antes de resolver
                    video.play().then(() => {
                      console.log('✅ Video reproduciendo');
                      resolve();
                    }).catch(reject);
                  });
                  
                  hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                      console.error('❌ Error fatal HLS:', data);
                      reject(new Error(`Error HLS: ${data.type} - ${data.details}`));
                    }
                  });
                  
                  // Guardar referencia a hls para limpieza posterior
                  video._hlsInstance = hls;
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                  // Safari nativo
                  video.src = data.hlsUrl;
                  video.oncanplay = () => {
                    video.play().then(resolve).catch(reject);
                  };
                  video.onerror = () => reject(new Error(`No se pudo conectar a ${data.hlsUrl}`));
                } else {
                  reject(new Error('Tu navegador no soporta HLS'));
                }
                
                setTimeout(() => reject(new Error('Timeout al conectar stream HLS')), 20000);
              });
              
              // Esperar un momento más para asegurar que hay tracks disponibles
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              const stream = video.captureStream();
              if (!stream.getTracks().length) {
                throw new Error('No se pudieron capturar tracks de video/audio del stream HLS');
              }
              console.log('✅ Stream capturado con', stream.getTracks().length, 'tracks');
              streamsRef.current[deviceId] = stream;
              
              setTimeout(() => {
                if (videoRefs.current[deviceId]) {
                  videoRefs.current[deviceId].srcObject = stream;
                  videoRefs.current[deviceId].muted = true;
                  videoRefs.current[deviceId].play();
                }
              }, 100);
              
              const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
              });
              
              const chunks = [];
              recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
              };
              
              recorder.onstop = () => {
                recordings[deviceId] = chunks;
                video.pause();
                video.src = '';
                if (Object.keys(recordings).length === selectedCameras.length) {
                  saveAllRecordings(recordings);
                }
              };
              
              recorder.start();
              mediaRecordersRef.current[deviceId] = recorder;
            } catch (err) {
              console.error('Error con cámara RTSP:', err);
              throw new Error('Error con RTSP: ' + err.message + '\n\nAsegúrate de que el servidor backend esté corriendo (cd server && npm start)');
            }
          } else {
            // URLs HTTP/HTTPS/HLS directas
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.src = ipCamera.url;
            video.autoplay = true;
            video.muted = true;
            
            await new Promise((resolve, reject) => {
              video.onloadedmetadata = resolve;
              video.onerror = () => reject(new Error(`No se pudo conectar a ${ipCamera.url}`));
              setTimeout(() => reject(new Error('Timeout al conectar cámara IP')), 10000);
            });
            
            const stream = video.captureStream();
            streamsRef.current[deviceId] = stream;
            
            setTimeout(() => {
              if (videoRefs.current[deviceId]) {
                videoRefs.current[deviceId].srcObject = stream;
                videoRefs.current[deviceId].muted = true;
                videoRefs.current[deviceId].play();
              }
            }, 100);
            
            const recorder = new MediaRecorder(stream, {
              mimeType: 'video/webm;codecs=vp9'
            });
            
            const chunks = [];
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunks.push(e.data);
            };
            
            recorder.onstop = () => {
              recordings[deviceId] = chunks;
              video.pause();
              video.src = '';
              if (Object.keys(recordings).length === selectedCameras.length) {
                saveAllRecordings(recordings);
              }
            };
            
            recorder.start();
            mediaRecordersRef.current[deviceId] = recorder;
          }
        } else {
          // Manejar cámara local
          const isFirstCamera = selectedCameras.indexOf(deviceId) === 0;
  
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } },
            audio: isFirstCamera  // Solo la primera cámara tendrá audio
          });
          
          streamsRef.current[deviceId] = stream;
          
          setTimeout(() => {
            if (videoRefs.current[deviceId]) {
              videoRefs.current[deviceId].srcObject = stream;
              videoRefs.current[deviceId].muted = true;
              videoRefs.current[deviceId].play();
            }
          }, 100);
          
          const recorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9'
          });
          
          const chunks = [];
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };
          
          recorder.onstop = () => {
            recordings[deviceId] = chunks;
            if (Object.keys(recordings).length === selectedCameras.length) {
              saveAllRecordings(recordings);
            }
          };
          
          recorder.start();
          mediaRecordersRef.current[deviceId] = recorder;
        }
      }
      
      setIsRecording(true);
      
     timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Si hay un límite seleccionado (>0) y se alcanza, detener.
          if (selectedDuration > 0 && newTime >= selectedDuration) {
            stopStreaming();
          }
          return newTime;
        });
     }, 1000);
      
    } catch (err) {
      console.error('Error:', err);
      alert(t('errorStartingRecording') + ': ' + err.message);
      setStep('form');
    }
  };

  const stopStreaming = () => {
    Object.values(mediaRecordersRef.current).forEach(recorder => {
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
    });
    
    Object.values(streamsRef.current).forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRecording(false);
  };

  const saveAllRecordings = (recordings) => {
    selectedCameras.forEach((deviceId, index) => {
      const chunks = recordings[deviceId];
      if (!chunks) return;
      
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      const localCamera = availableCameras.find(c => c.deviceId === deviceId);
      const ipCamera = ipCameras.find(c => c.deviceId === deviceId);
      const camera = localCamera || ipCamera;
      
      const cameraName = camera?.label?.replace(/[^a-z0-9]/gi, '_') || `camara_${index + 1}`;
      const folderName = `${patientData.apellido}_${patientData.nombre}_${patientData.identificacion}`;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${folderName}/${cameraName}_${timestamp}.webm`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    
    setStep('completed');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetApp = () => {
    setStep('form');
    setPatientData({
      nombre: '',
      apellido: '',
      identificacion: '',
      edad: '',
      tipoEstudio: 'EEG'
    });
    setSelectedCameras([]);
    setRecordingTime(0);
    mediaRecordersRef.current = {};
    streamsRef.current = {};
  };

  useEffect(() => {
    loadAvailableCameras();
    
    const handleDeviceChange = () => {
      console.log('📹 Cambio detectado en dispositivos de video');
      loadAvailableCameras();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      Object.values(streamsRef.current).forEach(stream => {
        stream?.getTracks().forEach(track => track.stop());
      });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const isFormValid = patientData.nombre && patientData.apellido && 
                      patientData.identificacion && patientData.edad &&
                      selectedCameras.length > 0;

  return (
  <div className="min-h-screen p-4 md:p-6 bg-linear-to-br from-blue-50 to-indigo-100">
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center md:mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Camera className="text-indigo-600" size={40} />
          <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">{t('title')}</h1>
        </div>
        <p className="text-sm text-gray-600 md:text-base">{t('subtitle')}</p>
      </div>

      {/* Vista de Formulario */}
      {step === 'form' && (
        <div className="p-4 bg-white rounded-lg shadow-lg md:p-6">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b md:mb-6 md:pb-4">
            <User className="text-indigo-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800 md:text-2xl">{t('patientData')}</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">{t('name')}</label>
              <input
                type="text"
                name="nombre"
                value={patientData.nombre}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t('placeholders.patientName')}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">{t('lastName')}</label>
              <input
                type="text"
                name="apellido"
                value={patientData.apellido}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t('placeholders.patientLastName')}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">{t('identification')}</label>
              <input
                type="text"
                name="identificacion"
                value={patientData.identificacion}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t('placeholders.documentNumber')}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">{t('age')}</label>
              <input
                type="number"
                name="edad"
                value={patientData.edad}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t('placeholders.ageYears')}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-indigo-600" />
                  {t('recordingDuration')}
                </div>
              </label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value={0}>{t('noLimit')}</option>
                <option value={1800}>30 {t('minutes')}</option>
                <option value={3600}>1 {t('hour')}</option>
                <option value={7200}>2 {t('hours')}</option>
                <option value={10800}>3 {t('hours')}</option>
                <option value={14400}>4 {t('hours')}</option>
                <option value={18000}>5 {t('hours')}</option>
                <option value={21600}>6 {t('hours')}</option>
                <option value={43200}>12 {t('hours')}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-gray-700">{t('studyType')}</label>
              <select
                name="tipoEstudio"
                value={patientData.tipoEstudio}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="EEG">{t('studyTypes.eeg')}</option>
                <option value="EMG">{t('studyTypes.emg')}</option>
                <option value="Evoked">{t('studyTypes.evoked')}</option>
                <option value="Sleep">{t('studyTypes.sleep')}</option>
                <option value="Mapping">{t('studyTypes.mapping')}</option>
              </select>
            </div>

            {/* Selector de cámaras */}
            <div className="md:col-span-2">
              <label className="block mb-3 text-sm font-medium text-gray-700">
                {t('availableCameras')} ({availableCameras.length + ipCameras.length}) *
              </label>
              {availableCameras.length === 0 && ipCameras.length === 0 ? (
                <p className="text-sm text-gray-500">{t('loadingCameras')}</p>
              ) : (
                <div className="space-y-2">
                  {/* Cámaras locales */}
                  {availableCameras.map((camera) => (
                    <label
                      key={camera.deviceId}
                      className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{
                        borderColor: selectedCameras.includes(camera.deviceId) ? '#4F46E5' : '#D1D5DB',
                        backgroundColor: selectedCameras.includes(camera.deviceId) ? '#EEF2FF' : 'white'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCameras.includes(camera.deviceId)}
                        onChange={() => toggleCameraSelection(camera.deviceId)}
                        className="w-5 h-5 text-indigo-600"
                      />
                      <Camera className="mx-3 text-indigo-600" size={20} />
                      <span className="font-medium text-gray-700">
                        {camera.label || `Cámara ${camera.deviceId.substring(0, 10)}...`}
                      </span>
                    </label>
                  ))}
                  
                  {/* Cámaras IP */}
                  {ipCameras.map((camera) => (
                    <label
                      key={camera.deviceId}
                      className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{
                        borderColor: selectedCameras.includes(camera.deviceId) ? '#10B981' : '#D1D5DB',
                        backgroundColor: selectedCameras.includes(camera.deviceId) ? '#ECFDF5' : 'white'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCameras.includes(camera.deviceId)}
                        onChange={() => toggleCameraSelection(camera.deviceId)}
                        className="w-5 h-5 text-green-600"
                      />
                      <Video className="mx-3 text-green-600" size={20} />
                      <div className="flex-1">
                        <span className="font-medium text-gray-700 block">
                          {camera.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {camera.url}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          removeIpCamera(camera.deviceId);
                        }}
                        className="ml-2 text-red-600 hover:text-red-800 font-bold"
                        title={t('removeIpCamera')}
                      >
                        ✕
                      </button>
                    </label>
                  ))}
                </div>
              )}
              {selectedCameras.length > 1 && (
                <p className="mt-2 text-sm text-indigo-600 font-medium">
                  ✅ {t('willRecord')} {selectedCameras.length} {t('cameras')} {t('simultaneously')}
                </p>
              )}
              
              {/* Agregar cámara IP */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  🌐 {t('addCamera')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ipCameraUrl}
                    onChange={(e) => setIpCameraUrl(e.target.value)}
                    placeholder="rtsp://localhost:8554/live"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addIpCamera}
                    className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {t('add')}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {t('supportedFormats')}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={startStreaming}
            disabled={!isFormValid}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 text-lg font-semibold text-white rounded-lg transition-colors ${
              isFormValid 
                ? 'bg-indigo-600 hover:bg-indigo-700' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <Video size={24} />
            {t('startRecording')}{selectedCameras.length > 1 ? ` (${selectedCameras.length} ${t('cameras')})` : ''}
          </button>
        </div>
      )}

      {/* Vista de Streaming */}
      {step === 'streaming' && (
        <div className="p-4 bg-white rounded-lg shadow-lg md:p-6">
          <div className="flex flex-col items-center justify-between gap-3 mb-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Video className="text-indigo-600" size={24} />
              <h2 className="text-lg font-bold text-gray-800 md:text-xl">
                {t('recordingInProgress')} {selectedCameras.length > 1 ? `(${selectedCameras.length} ${t('cameras')})` : ''}
              </h2>
            </div>
            <div className="font-mono text-2xl font-bold text-gray-800 md:text-3xl">
              {formatTime(recordingTime)}
            </div>
          </div>

          <div className={`grid gap-4 mb-4 ${selectedCameras.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {selectedCameras.map((deviceId) => {
              const localCamera = availableCameras.find(c => c.deviceId === deviceId);
              const ipCamera = ipCameras.find(c => c.deviceId === deviceId);
              const camera = localCamera || ipCamera;
              
              return (
                <div key={deviceId} className="overflow-hidden bg-gray-900 rounded-lg">
                  <div className="p-2 bg-gray-800">
                    <p className="text-sm font-medium text-white">
                      {ipCamera ? '🌐' : '📹'} {camera?.label || 'Cámara'}
                    </p>
                  </div>
                  <video
                    ref={(el) => { if (el) videoRefs.current[deviceId] = el; }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full"
                    style={{ 
                      transform: ipCamera ? 'none' : 'scaleX(-1)',
                      minHeight: '200px',
                      maxHeight: '400px',
                      objectFit: 'cover',
                      backgroundColor: '#1f2937'
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="p-4 mb-4 rounded-lg bg-gray-50">
            <h3 className="mb-3 text-base font-semibold text-gray-700">{t('patientInfo')}</h3>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 md:text-base">
              <div><span className="font-medium">{t('fullName')}:</span> {patientData.nombre} {patientData.apellido}</div>
              <div><span className="font-medium">{t('identification')}:</span> {patientData.identificacion}</div>
              <div><span className="font-medium">{t('age')}:</span> {patientData.edad} {` ${t('years')}`}</div>
              <div><span className="font-medium">{t('studyType')}:</span> {patientData.tipoEstudio}</div>
            </div>
          </div>

          <button
            onClick={stopStreaming}
            className="flex items-center justify-center w-full gap-2 px-6 py-4 text-lg font-semibold text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
          >
            <StopCircle size={24} />
            {t('stopRecording')}
          </button>
        </div>
      )}

      {/* Vista de Completado */}
      {step === 'completed' && (
        <div className="p-6 text-center bg-white rounded-lg shadow-lg md:p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
            <Save className="text-green-600" size={32} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-800 md:text-2xl">
            {selectedCameras.length > 1 ? t('recordingsSaved') : t('recordingSaved')}
          </h2>
          <p className="mb-6 text-sm text-gray-600 md:text-base">
            {selectedCameras.length > 1 
              ? `${selectedCameras.length} ${t('videosSaved')}` 
              : t('videoSaved')}
          </p>

          <div className="p-4 mb-6 text-left rounded-lg md:p-6 bg-gray-50">
            <h3 className="flex items-center gap-2 mb-3 text-base font-semibold text-gray-700">
              <FileText size={18} />
              {t('recordingDetails')}
            </h3>
            <div className="space-y-2 text-sm md:text-base">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-gray-600">{t('folder')}</span>
                <span className="px-2 py-1 font-mono text-xs break-all bg-white rounded md:text-sm">
                  {patientData.apellido}_{patientData.nombre}_{patientData.identificacion}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('duration')}</span>
                <span className="font-semibold">{formatTime(recordingTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('date')}</span>
                <span className="font-semibold">{new Date().toLocaleDateString('es-CO')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={resetApp}
            className="px-6 py-3 font-semibold text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            {t('newRecording')}
          </button>
        </div>
      )}
    </div>
  </div>
  );
}

export default App;
