# Usamos Node ligero
FROM node:18-slim

# Instalamos FFmpeg (necesario para tu app)
RUN apt-get update && apt-get install -y ffmpeg

# Definimos carpeta de trabajo
WORKDIR /app

# Copiamos package.json e instalamos dependencias
COPY package*.json ./
RUN npm install

# Copiamos el resto del código del servidor
COPY . .

# Creamos carpetas para evitar errores de escritura
RUN mkdir -p hls recordings

# Exponemos el puerto
EXPOSE 3001

# Comando para iniciar
CMD ["node", "index.js"]