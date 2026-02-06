import React, { useState } from 'react';
import { Upload, Download, Scissors, AlertCircle, Loader2, Server, X, CheckCircle2 } from 'lucide-react';

const FALLBACK_URL = 'https://ezehcut.onrender.com';

export default function App() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [processedUrl, setProcessedUrl] = useState(null);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('ezehcut_api_url') || FALLBACK_URL);

  const processAudio = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProcessedUrl(null);
    setError(null);
    setProgress(0);

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

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.replace('data: ', ''));
            if (data.error) throw new Error(data.error);
            if (data.status) setStatus(data.status);
            if (data.progress) setProgress(data.progress);
            if (data.audio) {
              const byteCharacters = atob(data.audio);
              const byteNumbers = new Array(byteCharacters.length).map((_, i) => byteCharacters.charCodeAt(i));
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'audio/mpeg' });
              setProcessedUrl(URL.createObjectURL(blob));
            }
          }
        }
      }
    } catch (err) {
      setError("Error en la conexión. Reintenta en unos segundos.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-10 shadow-2xl">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-red-600 tracking-tighter italic">EZEHCUT</h1>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-zinc-900 rounded-full transition-colors"><Server size={20} className="text-zinc-500" /></button>
        </div>

        <div className="space-y-6">
          {!isProcessing && !processedUrl && (
            <label className="group border-2 border-dashed border-zinc-800 hover:border-red-600 rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer bg-zinc-900/10 transition-all">
              <Upload className="w-10 h-10 mb-4 text-zinc-700 group-hover:text-red-600" />
              <p className="text-zinc-400 text-center font-medium">{file ? file.name : 'Subir audio de larga duración'}</p>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} accept="audio/*" />
            </label>
          )}

          {isProcessing && (
            <div className="py-10 space-y-6 animate-in fade-in">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-zinc-500">
                <span>{status}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden">
                <div className="bg-red-600 h-full transition-all duration-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm italic">
                <Loader2 className="animate-spin" size={16} /> No cierres esta ventana...
              </div>
            </div>
          )}

          {file && !isProcessing && !processedUrl && (
            <button onClick={processAudio} className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95">INICIAR LIMPIEZA TOTAL</button>
          )}

          {processedUrl && (
            <div className="p-8 bg-zinc-900/30 border border-green-900/20 rounded-3xl text-center space-y-6 animate-in zoom-in-95">
              <div className="flex items-center justify-center gap-2 text-green-500 font-black uppercase tracking-tighter"><CheckCircle2 size={20}/> ¡PROCESO COMPLETADO!</div>
              <a href={processedUrl} download={`EzehCut_Master_${file?.name}`} className="flex items-center justify-center gap-3 w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all shadow-xl"><Download size={20} /> DESCARGAR AUDIO</a>
              <button onClick={() => {setFile(null); setProcessedUrl(null); setProgress(0);}} className="text-zinc-500 text-xs hover:text-white underline">Procesar otro archivo de una hora</button>
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem] w-full max-w-sm">
            <h3 className="text-xl font-bold text-white mb-6">Endpoint API</h3>
            <input type="text" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-red-500 mb-6 font-mono outline-none" />
            <button onClick={() => { localStorage.setItem('ezehcut_api_url', apiUrl); setShowSettings(false); }} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black transition-colors hover:bg-red-700">GUARDAR</button>
          </div>
        </div>
      )}
    </div>
  );
}
