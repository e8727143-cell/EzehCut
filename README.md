# EZEHCUT WEB

Modern web interface for audio silence removal.

## 🚀 Getting Started

This application consists of a **React Frontend** and a **FastAPI Backend**. Both need to be running for the app to function correctly.

### 1. Backend Setup (Python)

You need Python installed. You also need `ffmpeg` installed on your system for `pydub` to work (just like the original Tkinter script).

```bash
# Navigate to backend folder (create it if you copied the code manually)
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the server
# It will start on http://localhost:8000
python main.py
```

*Note: Ensure `ffmpeg` is in your system PATH.*

### 2. Frontend Setup (React)

If you are running this in a local node environment:

```bash
# Install dependencies
npm install

# Run development server
npm start
```

## 🛠 Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI, Pydub
- **Processing**: FFmpeg (via Pydub)

## ⚠️ Important Note for Web Previews

This application relies on a connection to `localhost:8000`. If you are viewing this in a sandboxed web preview, the **processing feature will fail** unless you have the backend running locally on your machine and your browser allows the connection (CORS is configured to allow all origins in the backend code).
