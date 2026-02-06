import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Scissors, AlertCircle, Loader2, Server, X, CheckCircle2, Clock, Activity } from 'lucide-react';

const FALLBACK_URL = 'https://ezehcut.onrender.com';

export default function App() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [processedBlobUrl, setProcessedBlobUrl] = useState(null);
  const [error, setError] = useState(null);
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
    setSeconds(0);
    
    try {
      // 1. Convertir archivo a un formato manejable
      setStatus('Preparando motor de fragmentación...');
      const arrayBuffer = await file.arrayBuffer();
      const totalSize = arrayBuffer.byteLength;
      
      // Dividimos en fragmentos de 4MB para no saturar Render Free (512MB RAM)
      const chunkSize = 4 * 1024 * 1024; 
      const chunks = Math.ceil(totalSize / chunkSize);
      let combinedBytes = new Uint8Array(0);

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, totalSize);
        const chunk = arrayBuffer.slice(start, end);
        
        setStatus(`Procesando bloque ${i + 1} de ${chunks}...`);
        setProgress(Math.round((i / chunks) * 100));

        const formData = new FormData();
        formData.append('file', new Blob([chunk]), 'chunk.mp3');

        const response = await fetch(`${apiUrl.replace(/\/$/, '')}/process-audio`, {
          method: 'POST',
          body: formData,
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const data = JSON.parse(decoder.decode(value).replace('data: ', ''));
          
          if (data.audio) {
            const binaryString = window.atob(data.audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) bytes[j] = binaryString.charCodeAt(j);
            
            const newCombined = new Uint8Array(combinedBytes.length + bytes.length);
            newCombined.set(combinedBytes);
            newCombined.set(bytes, combinedBytes.length);
            combinedBytes = newCombined;
          }
        }
      }

      const finalBlob = new Blob([combinedBytes], { type: 'audio/mpeg' });
      setProcessedBlobUrl(URL.createObjectURL(finalBlob));
      setProgress(100);
      setStatus('¡Limpieza completa!');
    } catch (err) {
      setError("El servidor está saturado. Intenta con un archivo más pequeño o espera 1 minuto.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-10 shadow-2xl">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-2">
            <Activity className="text-red-600" size={24} />
            <h1 className="text-3xl font-black italic">EZEHCUT</h1>
          </div>
          <span className="text-[10px] bg-red-600/20 text-red-500 px-3 py-1 rounded-full font-bold">MODO PESADO ACTIVO</span>
        </div>

        <div className="space-y-6">
          {!isProcessing && !processedBlobUrl && (
            <label className="border-2 border-dashed border-zinc-800 hover:border-red-600 rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer bg-zinc-900/10 transition-all">
              <Upload className="w-12 h-12 mb-4 text-zinc-700" />
              <p className="text-zinc-400 font-bold">{file ? file.name : 'Subir audio (Soporta 1 hora)'}</p>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          )}

          {isProcessing && (
            <div className="py-10 space-y-6">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-red-600">
                <span>{status}</span>
                <span>{formatTime(seconds)}</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {file && !isProcessing && !processedBlobUrl && (
            <button onClick={processAudio} className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-xl">INICIAR PROCESADO POR BLOQUES</button>
          )}

          {processedBlobUrl && (
            <div className="p-8 bg-zinc-900/30 border border-green-900/20 rounded-3xl text-center space-y-6">
              <CheckCircle2 className="mx-auto text-green-500" size={48} />
              <h3 className="text-xl font-black">¡TODO LISTO! ({formatTime(seconds)})</h3>
              <a href={processedBlobUrl} download={`EzehCut_${file?.name}`} className="flex items-center justify-center gap-3 w-full py-5 bg-white text-black font-black rounded-2xl shadow-2xl">
                <Download size={20} /> DESCARGAR AUDIO FINAL
              </a>
              <button onClick={() => {setFile(null); setProcessedBlobUrl(null);}} className="text-zinc-500 text-xs underline">Procesar otro</button>
            </div>
          )}

          {error && <div className="p-4 bg-red-900/20 text-red-500 rounded-xl text-sm border border-red-900/30">{error}</div>}
        </div>
      </div>
    </div>
  );
}
