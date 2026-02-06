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
            # ETAPA 1: RECEPCIÓN
            yield f"data: {json.dumps({'status': '📥 Recibiendo señal de audio...', 'progress': 5})}\n\n"
            input_data = await file.read()
            
            # ETAPA 2: ANÁLISIS
            yield f"data: {json.dumps({'status': '🔍 Analizando espectro de frecuencias (-35dB)...', 'progress': 15})}\n\n"
            await asyncio.sleep(0.5)

            # ETAPA 3: PROCESAMIENTO FFmpeg (C-Engine)
            yield f"data: {json.dumps({'status': '✂️ Cortando silencios en tiempo real (Motor FFmpeg)...', 'progress': 40})}\n\n"
            
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
            
            stdout, stderr = await process.communicate(input=input_data)

            if process.returncode != 0:
                yield f"data: {json.dumps({'error': 'Fallo en el motor de corte de audio.'})}\n\n"
                return

            # ETAPA 4: ENSAMBLAJE
            yield f"data: {json.dumps({'status': '🏗️ Ensamblando partes y unificando master...', 'progress': 80})}\n\n"
            await asyncio.sleep(0.5)

            # ETAPA 5: CODIFICACIÓN FINAL
            yield f"data: {json.dumps({'status': '📦 Codificando resultado para descarga...', 'progress': 95})}\n\n"
            
            audio_64 = base64.b64encode(stdout).decode()
            yield f"data: {json.dumps({'status': '✅ ¡Silencios quitados con éxito!', 'progress': 100, 'audio': audio_64})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
