from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydub import AudioSegment
from pydub.silence import split_on_silence
import io
import json
import asyncio
import base64

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
            # 1. Inicio
            yield f"data: {json.dumps({'status': 'Cargando archivo a memoria...', 'progress': 5})}\n\n"
            content = await file.read()
            audio = AudioSegment.from_file(io.BytesIO(content))
            
            ten_minutes = 10 * 60 * 1000
            audio_length = len(audio)
            num_chunks = (audio_length // ten_minutes) + 1
            combined = AudioSegment.empty()

            yield f"data: {json.dumps({'status': f'Audio detectado: {audio_length/60000:.1f} min. Dividiendo en {num_chunks} partes...', 'progress': 10})}\n\n"

            # 2. Procesamiento por partes
            for i in range(0, audio_length, ten_minutes):
                chunk_idx = (i // ten_minutes) + 1
                progress = 10 + int((chunk_idx / num_chunks) * 70)
                
                yield f"data: {json.dumps({'status': f'Quitando silencios de Parte {chunk_idx}/{num_chunks}...', 'progress': progress})}\n\n"
                
                end = min(i + ten_minutes, audio_length)
                current_chunk = audio[i:end]
                
                # Procesar silencio (Lógica EzehCUT)
                processed = split_on_silence(current_chunk, min_silence_len=700, silence_thresh=-35, keep_silence=200)
                
                for p in processed:
                    combined += p
                
                await asyncio.sleep(0.1) # Evitar bloqueo de event loop

            # 3. Finalización
            yield f"data: {json.dumps({'status': 'Uniendo partes y masterizando...', 'progress': 90})}\n\n"
            
            output_buffer = io.BytesIO()
            combined.export(output_buffer, format="mp3", bitrate="192k")
            audio_64 = base64.b64encode(output_buffer.getvalue()).decode()

            yield f"data: {json.dumps({'status': '¡Proceso completado con éxito!', 'progress': 100, 'audio': audio_64})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
