import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Scissors, AlertCircle, Loader2, Server, X, CheckCircle2, Clock } from 'lucide-react';

const FALLBACK_URL = 'https://ezehcut.onrender.com';

export default function App() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [processedBlobUrl, setProcessedBlobUrl] = useState(null);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('ezehcut_api_url') || FALLBACK_URL);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isProcessing) {
      timerRef.current = setInterval(() => setSeconds(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isProcessing]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const processAudio = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProcessedBlobUrl(null);
    setError(null);
    setProgress(0);
    setSeconds(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/process-audio`, {
        method: 'POST',
        body: formData,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            const data = JSON.parse(line.replace('data: ', ''));
            if (data.error) throw new Error(data.error);
            if (data.status) setStatus(data.status);
            if (data.progress) setProgress(data.progress);
            if (data.audio) {
              // Reconstrucción binaria inmediata
              const binaryString = window.atob(data.audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'audio/mpeg' });
              setProcessedBlobUrl(URL.createObjectURL(blob));
              setIsProcessing(false);
            }
          }
        }
      }
    } catch (err) {
      setError("Error: El servidor gratuito de Render se quedó sin memoria o la conexión expiró.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-10 shadow-2xl">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-red-600 tracking-tighter italic">EZEHCUT</h1>
          <button onClick={() => setShowSettings(true)} className="p-2 text-zinc-500 hover:text-white"><Server size={20} /></button>
        </div>

        <div className="space-y-6">
          {!isProcessing && !processedBlobUrl && (
            <label className="border-2 border-dashed border-zinc-800 hover:border-red-600 rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer bg-zinc-900/10 transition-all">
              <Upload className="w-10 h-10 mb-4 text-zinc-700" />
              <p className="text-zinc-400 font-medium text-center">{file ? file.name : 'Subir audio o video'}</p>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          )}

          {isProcessing && (
            <div className="py-10 space-y-6">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-red-600">
                <span>{status}</span>
                <span className="flex items-center gap-2"><Clock size={12}/> {formatTime(seconds)}</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div className="bg-red-600 h-full transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-center text-[10px] text-zinc-600">Procesando {formatTime(seconds)}...</p>
            </div>
          )}

          {file && !isProcessing && !processedBlobUrl && (
            <button onClick={processAudio} className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl">INICIAR LIMPIEZA TOTAL</button>
          )}

          {processedBlobUrl && (
            <div className="p-8 bg-zinc-900/30 border border-green-900/20 rounded-3xl text-center space-y-6 animate-in zoom-in-95">
              <div className="text-green-500 font-black">¡PROCESO COMPLETADO EN {formatTime(seconds)}!</div>
              <a 
                href={processedBlobUrl} 
                download={`EzehCut_Master_${file?.name}`}
                className="flex items-center justify-center gap-3 w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all shadow-xl"
              >
                <Download size={20} /> DESCARGAR AHORA
              </a>
              <button onClick={() => {setFile(null); setProcessedBlobUrl(null);}} className="text-zinc-500 text-xs underline">Procesar otro</button>
            </div>
          )}

          {error && <div className="p-4 bg-red-900/20 text-red-500 rounded-xl text-sm">{error}</div>}
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6">
          <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-3xl w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">API URL</h3>
            <input type="text" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 text-red-500 mb-6 font-mono outline-none" />
            <button onClick={() => {localStorage.setItem('ezehcut_api_url', apiUrl); setShowSettings(false);}} className="w-full bg-red-600 py-4 rounded-xl font-black">GUARDAR</button>
          </div>
        </div>
      )}
    </div>
  );
}
