import asyncio
import json
import base64
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

app = FastAPI()

# Configuración de CORS abierta para el Enjambre
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process-audio")
async def process_audio(file: UploadFile = File(...)):
    async def event_generator():
        try:
            # Leemos el fragmento (aprox 1MB) directamente a memoria
            input_data = await file.read()
            
            # COMANDO FFmpeg: Optimizado para procesar por tuberías (pipes) sin tocar el disco
            cmd = [
                "ffmpeg", "-i", "pipe:0",
                "-af", "silenceremove=start_periods=1:start_threshold=-35dB:stop_periods=-1:stop_threshold=-35dB:stop_duration=0.7",
                "-f", "mp3", "-b:a", "128k", "pipe:1"
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Ejecución paralela del proceso de audio
            stdout, stderr = await process.communicate(input=input_data)

            if process.returncode != 0:
                yield f"data: {json.dumps({'error': 'Fallo en el motor FFmpeg'})}\n\n"
                return

            # Enviamos el audio procesado codificado en Base64
            # Al ser fragmentos de 1MB, el Base64 resultante es pequeño y viaja instantáneamente
            audio_64 = base64.b64encode(stdout).decode()
            yield f"data: {json.dumps({'audio': audio_64})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
