import os
import uuid
import asyncio
import json
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Carpeta temporal para descargas
TEMP_DIR = "/tmp/ezehcut_files"
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

def clean_file(path: str):
    """Elimina el archivo después de 10 minutos para ahorrar espacio."""
    try:
        if os.path.exists(path):
            os.remove(path)
    except:
        pass

@app.post("/process-audio")
async def process_audio(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    input_path = os.path.join(TEMP_DIR, f"in_{file_id}_{file.filename}")
    output_filename = f"EzehCut_{file.filename}.mp3"
    output_path = os.path.join(TEMP_DIR, f"out_{file_id}.mp3")

    async def event_generator():
        try:
            yield f"data: {json.dumps({'status': 'Recibiendo señal...', 'progress': 10})}\n\n"
            
            with open(input_path, "wb") as f:
                f.write(await file.read())

            yield f"data: {json.dumps({'status': 'Motor FFmpeg iniciado (Alta Velocidad)...', 'progress': 30})}\n\n"

            # COMANDO MAESTRO: Usa el filtro nativo de FFmpeg (C-code) en lugar de Python
            # Esto es extremadamente rápido y eficiente en RAM.
            cmd = [
                "ffmpeg", "-i", input_path,
                "-af", "silenceremove=start_periods=1:start_threshold=-35dB:stop_periods=-1:stop_threshold=-35dB:stop_duration=0.7",
                "-b:a", "192k", output_path, "-y"
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            
            yield f"data: {json.dumps({'status': 'Eliminando silencios en tiempo real...', 'progress': 60})}\n\n"
            await process.communicate()

            if process.returncode != 0:
                raise Exception("FFmpeg falló al procesar el audio")

            yield f"data: {json.dumps({'status': 'Finalizando masterización...', 'progress': 90})}\n\n"
            
            # Generar link de descarga en lugar de enviar el archivo por texto
            download_link = f"/download/{file_id}"
            yield f"data: {json.dumps({'status': '¡LISTO!', 'progress': 100, 'download_id': file_id})}\n\n"

            # Programar limpieza
            background_tasks.add_task(clean_file, input_path)
            background_tasks.add_task(clean_file, output_path)

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/download/{file_id}")
async def download_file(file_id: str):
    path = os.path.join(TEMP_DIR, f"out_{file_id}.mp3")
    if os.path.exists(path):
        return FileResponse(path, media_type="audio/mpeg", filename=f"audio_limpio_{file_id}.mp3")
    raise HTTPException(status_code=404, detail="Archivo expirado o no encontrado")
