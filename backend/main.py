from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydub import AudioSegment
from pydub.silence import split_on_silence
import io

app = FastAPI()

# PERMITIR QUE VERCEL SE CONECTE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción cambia esto por tu URL de Vercel
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process-audio")
async def process_audio(file: UploadFile = File(...)):
    try:
        # Leer archivo a memoria
        content = await file.read()
        audio = AudioSegment.from_file(io.BytesIO(content))

        # Lógica de EzehCUT: Quitar silencios 
        # min_silence_len=700ms (0.7s), silence_thresh=-35dB
        chunks = split_on_silence(
            audio, 
            min_silence_len=700, 
            silence_thresh=-35, 
            keep_silence=200
        )

        # Reconstruir audio
        combined = AudioSegment.empty()
        for chunk in chunks:
            combined += chunk

        # Exportar resultado
        buffer = io.BytesIO()
        combined.export(buffer, format="mp3", bitrate="192k")
        buffer.seek(0)

        return StreamingResponse(buffer, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
