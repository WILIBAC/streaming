import express from 'express';
import cors from 'cors';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Servir archivos estáticos (HLS) con headers correctos
app.use('/hls', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
}, express.static(path.join(__dirname, 'hls')));
app.use('/recordings', express.static(path.join(__dirname, 'recordings')));

// Crear directorios si no existen
const hlsDir = path.join(__dirname, 'hls');
const recordingsDir = path.join(__dirname, 'recordings');
if (!fs.existsSync(hlsDir)) {
  fs.mkdirSync(hlsDir, { recursive: true });
}
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

// Estado de streams y grabaciones activos
const activeStreams = new Map();
const activeRecordings = new Map();

// Endpoint para iniciar stream RTSP → HLS con grabación
app.post('/api/start-stream', async (req, res) => {
  console.log('\n========================================');
  console.log('🎬 NUEVA PETICIÓN: Iniciar Stream');
  console.log('========================================');
  const { rtspUrl, streamId = 'default', patientData } = req.body;
  console.log('📥 Datos recibidos:');
  console.log('  - RTSP URL:', rtspUrl);
  console.log('  - Stream ID:', streamId);
  console.log('  - Paciente:', patientData);

  if (!rtspUrl) {
    console.error('❌ ERROR: No se proporcionó rtspUrl');
    return res.status(400).json({ error: 'Se requiere rtspUrl' });
  }

  // Si ya existe un stream activo, detenerlo
  if (activeStreams.has(streamId)) {
    const existingStream = activeStreams.get(streamId);
    existingStream.kill('SIGKILL');
    activeStreams.delete(streamId);
  }

  const outputPath = path.join(hlsDir, `${streamId}.m3u8`);
  console.log('📁 Ruta HLS manifest:', outputPath);
  
  // 🧹 LIMPIAR ARCHIVOS ANTIGUOS DEL STREAM ANTES DE INICIAR
  console.log('🧹 Limpiando archivos HLS antiguos...');
  try {
    const files = fs.readdirSync(hlsDir);
    let deletedCount = 0;
    files.forEach(file => {
      if (file.startsWith(streamId)) {
        const filePath = path.join(hlsDir, file);
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`  ❌ Eliminado: ${file}`);
      }
    });
    console.log(`✅ ${deletedCount} archivo(s) antiguo(s) eliminado(s)`);
  } catch (err) {
    console.warn('⚠️  Error al limpiar archivos:', err.message);
  }
  
  // Crear nombre de archivo de grabación
  let recordingPath = null;
  if (patientData) {
    const folderName = `${patientData.apellido}_${patientData.nombre}_${patientData.identificacion}`;
    const patientDir = path.join(recordingsDir, folderName);
    console.log('📂 Directorio del paciente:', patientDir);
    if (!fs.existsSync(patientDir)) {
      console.log('📁 Creando directorio...');
      fs.mkdirSync(patientDir, { recursive: true });
    } else {
      console.log('✅ Directorio ya existe');
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    recordingPath = path.join(patientDir, `${folderName}_${timestamp}.mp4`);
    console.log('💾 Ruta de grabación:', recordingPath);
  }

  console.log('\n🚀 Configurando FFmpeg...');
  console.log('========================================');
  console.log('🎥 Conversión: RTSP → HLS');
  console.log('📡 Entrada:', rtspUrl);
  console.log('📁 Salida HLS:', outputPath);
  if (recordingPath) {
    console.log('⚠️  NOTA: Grabación MP4 DESACTIVADA temporalmente para debugging');
    // console.log('💾 Grabación:', recordingPath);
  }
  console.log('========================================\n');

  try {
    const stream = ffmpeg(rtspUrl)
      .inputOptions([
        '-rtsp_transport', 'tcp',
        '-fflags', '+genpts+igndts',
        '-flags', 'low_delay',
        '-err_detect', 'ignore_err',
        '-strict', 'experimental',
        '-analyzeduration', '1000000',
        '-probesize', '1000000'
      ])
      // SOLO OUTPUT: HLS para streaming (temporalmente sin MP4)
      .output(outputPath)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-crf', '23',
        '-maxrate', '2M',
        '-bufsize', '4M',
        '-g', '30',
        '-sc_threshold', '0',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
        '-start_number', '0',
        '-hls_time', '2',
        '-hls_list_size', '10',
        '-hls_flags', 'delete_segments',
        '-hls_delete_threshold', '3',
        '-hls_segment_type', 'mpegts',
        '-f', 'hls',
        '-hls_segment_filename', path.join(hlsDir, `${streamId}_%03d.ts`)
      ]);

    stream
      .on('start', (commandLine) => {
        console.log('✅ FFmpeg iniciado:', commandLine);
      })
      .on('stderr', (stderrLine) => {
        // Filtrar logs importantes de FFmpeg
        if (stderrLine.includes('Opening')) {
          console.log('🔌 FFmpeg: Abriendo conexión RTSP...');
        } else if (stderrLine.includes('Stream mapping')) {
          console.log('🗺️  FFmpeg: Mapeando streams de entrada/salida');
        } else if (stderrLine.includes('frame=')) {
          // Solo mostrar cada 100 frames para no saturar logs
          const match = stderrLine.match(/frame=\s*(\d+)/);
          if (match && parseInt(match[1]) % 100 === 0) {
            console.log(`⏩ Frames procesados: ${match[1]}`);
          }
        } else if (stderrLine.includes('.ts')) {
          console.log('📦 Nuevo segmento .ts generado');
        } else if (stderrLine.includes('error') || stderrLine.includes('Error')) {
          console.error('⚠️  FFmpeg Error:', stderrLine);
        } else if (stderrLine.includes('corrupt')) {
          console.warn('⚠️  Frame corrupto detectado (ignorado)');
        }
        // Log completo para debug profundo (comentar si es demasiado)
        // console.log('📹 FFmpeg:', stderrLine);
      })
      .on('error', (err, stdout, stderr) => {
        console.error('\n========================================');
        console.error('❌ ERROR CRÍTICO EN FFMPEG');
        console.error('========================================');
        console.error('💥 Mensaje:', err.message);
        console.error('📜 Stack:', err.stack);
        console.error('📄 Stderr completo:', stderr);
        console.error('========================================\n');
        activeStreams.delete(streamId);
        if (recordingPath) {
          activeRecordings.delete(streamId);
        }
      })
      .on('end', () => {
        console.log('⏹️ Stream finalizado');
        activeStreams.delete(streamId);
        if (recordingPath) {
          console.log('✅ Grabación guardada:', recordingPath);
          activeRecordings.delete(streamId);
        }
      });

    stream.run();
    activeStreams.set(streamId, stream);
    if (recordingPath) {
      activeRecordings.set(streamId, { path: recordingPath, patientData });
    }

    // Esperar hasta que el archivo .m3u8 exista ANTES de responder al cliente
    console.log('\n⏳ Esperando generación de archivo .m3u8 antes de responder...');
    const m3u8Path = path.join(hlsDir, `${streamId}.m3u8`);
    
    const waitForM3U8 = new Promise((resolve, reject) => {
      let checkAttempts = 0;
      const maxAttempts = 60; // 30 segundos máximo (60 * 500ms)
      
      const checkInterval = setInterval(() => {
        checkAttempts++;
        
        if (fs.existsSync(m3u8Path)) {
          const stats = fs.statSync(m3u8Path);
          if (stats.size > 0) {
            const content = fs.readFileSync(m3u8Path, 'utf8');
            if (content.includes('#EXTM3U')) {
              console.log(`✅ Archivo .m3u8 generado correctamente (${stats.size} bytes, intento ${checkAttempts})`);
              clearInterval(checkInterval);
              resolve();
              return;
            }
          }
        }
        
        if (checkAttempts % 10 === 0) {
          console.log(`⏳ Intento ${checkAttempts}/${maxAttempts}: Esperando .m3u8...`);
        }
        
        if (checkAttempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error('Timeout: El archivo .m3u8 no se generó en 30 segundos. Verifica que el stream RTSP esté activo.'));
        }
      }, 500);
    });

    await waitForM3U8;

    const responseData = {
      success: true,
      streamId,
      hlsUrl: `http://localhost:${PORT}/hls/${streamId}.m3u8`,
      recording: recordingPath ? true : false,
      recordingPath: recordingPath,
      message: 'Stream HLS listo para reproducir'
    };
    console.log('\n📤 Enviando respuesta al cliente:');
    console.log(responseData);
    console.log('========================================\n');
    res.json(responseData);

  } catch (error) {
    console.error('❌ Error al iniciar stream:', error);
    res.status(500).json({ error: error.message });
  }
});

// Objeto para mantener los streams de escritura activos
const activeWriteStreams = new Map();

// Endpoint para recibir los chunks de video
app.post('/api/stream-chunk/:streamId', (req, res) => {
  const { streamId } = req.params;
  const { fileName } = req.query;
  const filePath = path.join(recordingsDir, `${fileName || streamId}.webm`);
  const folderPath = path.dirname(filePath);

  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

  if (!activeWriteStreams.has(streamId)) {
    // Creamos el stream con flags de 'a' (append)
    const writeStream = fs.createWriteStream(filePath, { flags: 'a' });
    activeWriteStreams.set(streamId, writeStream);
    console.log(`🔴 Grabando en tiempo real: ${filePath}`);
  }

  const currentStream = activeWriteStreams.get(streamId);

  req.on('data', (chunk) => {
    currentStream.write(chunk); // Escribe el pedazo recibido
  });

  req.on('end', () => {
    res.status(200).send('OK');
  });
});

app.post('/api/stop-disk-write/:streamId', (req, res) => {
  const { streamId } = req.params;
  
  if (activeWriteStreams.has(streamId)) {
    const writeStream = activeWriteStreams.get(streamId);
    const originalPath = writeStream.path;
    
    console.log(`⏹️ Deteniendo grabación para: ${streamId}`);
    
    // 1. Forzamos el cierre del stream de escritura
    writeStream.end();
    activeWriteStreams.delete(streamId);

    // 2. Pequeña espera para que el sistema operativo libere el archivo
    setTimeout(() => {
      if (!fs.existsSync(originalPath)) {
        console.error("❌ El archivo original no existe en:", originalPath);
        return;
      }

      // Cambiamos a .mp4 para asegurar que se pueda adelantar/atrasar
      const finalMp4Path = originalPath.replace('.webm', '.mp4');
      console.log(`🛠️ Reconstruyendo y convirtiendo a MP4: ${finalMp4Path}`);

      ffmpeg(originalPath)
        .outputOptions([
          '-c copy',           // Copia directa (rápido)
          '-movflags +faststart' // Mueve el índice al inicio del archivo (vital para adelantar)
        ])
        .save(finalMp4Path)
        .on('start', (cmd) => console.log('🚀 FFmpeg ejecutando:', cmd))
        .on('end', () => {
          console.log(`✅ ¡ÉXITO! Video reparado y navegable: ${finalMp4Path}`);
          // Opcional: Borrar el .webm original si el .mp4 se creó bien
          try { fs.unlinkSync(originalPath); } catch(e) {}
        })
        .on('error', (err) => {
          console.error('❌ Error fatal en FFmpeg:', err.message);
        });
    }, 1000); // 1 segundo de espera para mayor seguridad

    res.json({ success: true, message: 'Reparación iniciada' });
  } else {
    console.warn(`⚠️ No se encontró stream activo para ID: ${streamId}`);
    res.status(404).json({ error: 'Stream no encontrado' });
  }
});
//********************** */

// Endpoint para verificar estado del stream
app.get('/api/stream-status/:streamId?', (req, res) => {
  const streamId = req.params.streamId || 'default';
  const isActive = activeStreams.has(streamId);

  res.json({
    streamId,
    active: isActive,
    hlsUrl: isActive ? `http://localhost:${PORT}/hls/${streamId}.m3u8` : null
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeStreams: Array.from(activeStreams.keys()),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor RTSP → HLS corriendo en http://localhost:${PORT}`);
  console.log(`📡 HLS disponible en http://localhost:${PORT}/hls/`);
  console.log(`\n📝 Ejemplo de uso:`);
  console.log(`POST http://localhost:${PORT}/api/start-stream`);
  console.log(`Body: { "rtspUrl": "rtsp://usuario:password@192.168.1.128:554/live" }\n`);
});
