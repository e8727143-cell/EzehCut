import asyncio
import json
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
            # Notificación inmediata para mantener viva la conexión
            yield f"data: {json.dumps({'status': '📥 Recibiendo segmento...', 'progress': 10})}\n\n"
            
            input_data = await file.read()
            
            # Comando optimizado para velocidad máxima
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
            
            yield f"data: {json.dumps({'status': '✂️ Eliminando silencios...', 'progress': 50})}\n\n"
            
            stdout, stderr = await process.communicate(input=input_data)

            if process.returncode != 0:
                yield f"data: {json.dumps({'error': 'Error en motor de audio'})}\n\n"
                return

            yield f"data: {json.dumps({'status': '✅ Segmento procesado', 'progress': 100, 'audio': base64.b64encode(stdout).decode()})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
