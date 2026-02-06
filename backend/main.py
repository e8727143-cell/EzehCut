from fastapi import FastAPI, UploadFile, HTTPException, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydub import AudioSegment, silence
import io
import os

app = FastAPI(title="EzehCut API", description="Audio Silence Remover Backend")

# CORS Configuration
# In production, you might want to restrict this to your Vercel domain.
# For now, "*" ensures the frontend can connect regardless of where it's deployed.
origins = [
    "*",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "online", "service": "EzehCut Backend", "ffmpeg_available": True}

@app.post("/process-audio")
async def process_audio(file: UploadFile = File(...)):
    """
    Receives an audio file, removes silence, and streams back the result.
    """
    
    # 1. Validate file type
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an audio file.")

    try:
        # 2. Read file into memory
        file_content = await file.read()
        audio_buffer = io.BytesIO(file_content)
        
        # 3. Load audio using Pydub
        try:
            original_audio = AudioSegment.from_file(audio_buffer)
        except Exception as e:
            print(f"Decoding Error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Could not decode audio. Ensure ffmpeg is installed on server.")

        # 4. Process: Split on silence
        # Using strict parameters to ensure silence is actually removed
        chunks = silence.split_on_silence(
            original_audio,
            min_silence_len=700,  # milliseconds
            silence_thresh=-35,   # dB
            keep_silence=200      # milliseconds
        )

        if not chunks:
            # Fallback if no silence detected or file is empty
            processed_audio = original_audio
        else:
            # 5. Recombine chunks
            processed_audio = chunks[0]
            for chunk in chunks[1:]:
                processed_audio += chunk

        # 6. Export to buffer
        output_buffer = io.BytesIO()
        processed_audio.export(output_buffer, format="mp3")
        output_buffer.seek(0)

        # 7. Return stream
        return StreamingResponse(
            output_buffer,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"attachment; filename=processed_{file.filename}.mp3",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Server Error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# This block is for local development only. 
# Docker/Production uses the CMD in Dockerfile.
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
