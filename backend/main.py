import asyncio
import json
import io
import base64
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

app = FastAPI()

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
            yield f"data: {json.dumps({'status': 'Recibiendo señal...', 'progress': 5})}\n\n"
            
            # Leer directamente a memoria para evitar errores de disco en Render
            input_data = await file.read()
            
            yield f"data: {json.dumps({'status': 'Procesando con motor de alta velocidad...', 'progress': 20})}\n\n"

            # Comando FFmpeg que lee de STDIN y escribe a STDOUT (Todo en memoria)
            cmd = [
                "ffmpeg", "-i", "pipe:0",
                "-af", "silenceremove=start_periods=1:start_threshold=-35dB:stop_periods=-1:stop_threshold=-35dB:stop_duration=0.7",
                "-f", "mp3", "-b:a", "192k", "pipe:1"
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            yield f"data: {json.dumps({'status': 'Eliminando silencios...', 'progress': 50})}\n\n"
            
            # Ejecutar y capturar resultado
            stdout, stderr = await process.communicate(input=input_data)

            if process.returncode != 0:
                logger_err = stderr.decode()
                yield f"data: {json.dumps({'error': f'FFmpeg Error: {logger_err[:100]}'})}\n\n"
                return

            yield f"data: {json.dumps({'status': 'Codificando resultado final...', 'progress': 90})}\n\n"
            
            # Convertir a Base64 para envío seguro por túnel de eventos
            audio_64 = base64.b64encode(stdout).decode()
            yield f"data: {json.dumps({'status': '¡PROCESO COMPLETADO!', 'progress': 100, 'audio': audio_64})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
