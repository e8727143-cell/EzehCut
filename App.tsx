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
    setStatus('Iniciando conexión...');

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
      setError("Error: La conexión expiró. Render Free puede ser lento con audios largos.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-10 shadow-2xl relative border-t-red-600/30">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-2">
            <Activity className="text-red-600 animate-pulse" size={24} />
            <h1 className="text-3xl font-black text-white tracking-tighter italic">EZEHCUT</h1>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 text-zinc-500 hover:text-white transition-all hover:rotate-90"><Server size={20} /></button>
        </div>

        <div className="space-y-6">
          {!isProcessing && !processedBlobUrl && (
            <label className="border-2 border-dashed border-zinc-800 hover:border-red-600 rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer bg-zinc-900/10 transition-all hover:bg-red-600/5 group">
              <Upload className="w-12 h-12 mb-4 text-zinc-700 group-hover:text-red-600 transition-all" />
              <p className="text-zinc-400 font-bold text-center">{file ? file.name : 'Subir audio o video'}</p>
              <p className="text-zinc-600 text-xs mt-2 font-mono">3 AUDIOS DIARIOS / 1 HORA MÁX</p>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          )}

          {isProcessing && (
            <div className="py-10 space-y-8 animate-in fade-in duration-500">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                  <span className="text-red-600 flex items-center gap-2">
                    <Loader2 className="animate-spin" size={14} /> {status}
                  </span>
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Clock size={14}/> {formatTime(seconds)}
                  </span>
                </div>
                <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-800">
                  <div className="bg-gradient-to-r from-red-900 to-red-600 h-full transition-all duration-700 shadow-[0_0_20px_rgba(220,38,38,0.4)]" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="text-center">
                 <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">Procesando señal en tiempo real...</p>
              </div>
            </div>
          )}

          {file && !isProcessing && !processedBlobUrl && (
            <button onClick={processAudio} className="group w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-red-900/20 active:scale-95 flex items-center justify-center gap-3">
              <Scissors size={20} className="group-hover:rotate-12 transition-all" /> INICIAR LIMPIEZA PROFESIONAL
            </button>
          )}

          {processedBlobUrl && (
            <div className="p-8 bg-zinc-900/30 border border-green-900/20 rounded-3xl text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="bg-green-600/10 inline-block p-4 rounded-full text-green-500 mb-2">
                <CheckCircle2 size={40}/>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">¡PROCESO COMPLETADO!</h3>
                <p className="text-zinc-500 text-xs italic">Tiempo de ejecución: {formatTime(seconds)}</p>
              </div>
              <a 
                href={processedBlobUrl} 
                download={`EzehCut_Master_${file?.name}`}
                className="flex items-center justify-center gap-3 w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all shadow-2xl shadow-white/10"
              >
                <Download size={20} /> DESCARGAR RESULTADO LIMPIO
              </a>
              <button onClick={() => {setFile(null); setProcessedBlobUrl(null); setProgress(0); setSeconds(0);}} className="text-zinc-500 text-xs hover:text-white underline decoration-red-600/50 underline-offset-4">Limpiar otro archivo</button>
            </div>
          )}

          {error && (
            <div className="p-5 bg-red-950/20 border border-red-900/30 rounded-2xl text-red-500 text-sm flex gap-3 items-center animate-in shake">
              <AlertCircle size={20} className="shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem] w-full max-w-sm">
            <h3 className="text-xl font-bold mb-6 text-white tracking-tight">Endpoint API</h3>
            <input type="text" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-red-600 mb-6 font-mono outline-none focus:border-red-600 transition-all" />
            <button onClick={() => {localStorage.setItem('ezehcut_api_url', apiUrl); setShowSettings(false);}} className="w-full bg-red-600 py-4 rounded-2xl font-black hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20">GUARDAR CAMBIOS</button>
          </div>
        </div>
      )}
    </div>
  );
}
