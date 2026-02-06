from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydub import AudioSegment
from pydub.silence import split_on_silence
import io
import logging

# Configuración de logs para monitorear el proceso en Render
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EzehCut-Optimizer")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process-audio")
async def process_audio(file: UploadFile = File(...)):
    try:
        logger.info(f"Iniciando procesamiento de archivo pesado: {file.filename}")
        
        # 1. Leer el archivo a un buffer temporal
        file_content = await file.read()
        audio = AudioSegment.from_file(io.BytesIO(file_content))
        
        # 2. Definir tamaño del segmento (10 minutos para seguridad de RAM)
        ten_minutes = 10 * 60 * 1000 
        audio_length = len(audio)
        combined = AudioSegment.empty()

        logger.info(f"Duración total: {audio_length / 60000:.2f} minutos. Procesando por segmentos...")

        # 3. Procesamiento por segmentos para no saturar los 512MB de RAM
        for i in range(0, audio_length, ten_minutes):
            end = min(i + ten_minutes, audio_length)
            chunk_to_process = audio[i:end]
            
            # Aplicar lógica de EzehCUT a este fragmento
            processed_chunks = split_on_silence(
                chunk_to_process,
                min_silence_len=700,
                silence_thresh=-35,
                keep_silence=200
            )
            
            for p_chunk in processed_chunks:
                combined += p_chunk
            
            logger.info(f"Segmento {i//ten_minutes + 1} completado.")

        # 4. Exportar el resultado final
        output_buffer = io.BytesIO()
        combined.export(output_buffer, format="mp3", bitrate="192k")
        output_buffer.seek(0)

        logger.info("Procesamiento finalizado con éxito.")
        return StreamingResponse(output_buffer, media_type="audio/mpeg")

    except Exception as e:
        logger.error(f"Error procesando audio: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al procesar audio pesado.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
