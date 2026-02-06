import React, { useState } from 'react';
import { Upload, Download, Scissors, AlertCircle, Loader2, Server, X, Save, Music } from 'lucide-react';

const FALLBACK_URL = 'https://ezehcut.onrender.com';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const [apiUrl, setApiUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ezehcut_api_url') || (import.meta as any).env?.VITE_API_URL || FALLBACK_URL;
    }
    return FALLBACK_URL;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setProcessedUrl(null);
      setError(null);
    }
  };

  const processAudio = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/process-audio`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Error ${response.status}: El servidor no respondió correctamente.`);

      const blob = await response.blob();
      setProcessedUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      setError(err.message === "Failed to fetch" ? "Error de conexión. Render podría estar despertando (espera 50s)." : err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans p-4 flex flex-col items-center justify-center">
      {/* Header Ficticio */}
      <div className="w-full max-w-2xl mb-8 flex justify-between items-center px-4">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-1.5 rounded-lg">
            <Scissors size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter italic">EZEHCUT</h1>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-zinc-900 rounded-full transition-colors group">
          <Server size={20} className="text-zinc-500 group-hover:text-red-500" />
        </button>
      </div>

      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">Quitar silencios</h2>
            <p className="text-zinc-500 text-sm">Umbral automático de -35dB para cortes precisos.</p>
          </div>

          <label className="group border-2 border-dashed border-zinc-800 hover:border-red-600/50 rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all bg-zinc-900/10 hover:bg-red-600/5">
            <div className="bg-zinc-900 p-5 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
               <Upload className="w-8 h-8 text-zinc-500 group-hover:text-red-500" />
            </div>
            <p className="text-zinc-400 font-medium">
              {file ? file.name : 'Arrastra tu audio o haz clic'}
            </p>
            <p className="text-zinc-600 text-xs mt-2 font-mono uppercase tracking-widest">MP3, WAV, AAC, M4A</p>
            <input type="file" className="hidden" onChange={handleFileChange} accept="audio/*" />
          </label>

          {file && !processedUrl && (
            <button 
              onClick={processAudio}
              disabled={isProcessing}
              className="w-full py-5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-900 disabled:text-zinc-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-red-600/20 active:scale-95"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <Music size={20} />}
              {isProcessing ? 'PROCESANDO SEÑAL...' : 'INICIAR PROCESO'}
            </button>
          )}

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-2xl text-red-500 text-sm flex gap-3 items-center animate-in fade-in duration-300">
              <AlertCircle size={20} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {processedUrl && (
            <div className="p-8 bg-zinc-900/30 border border-green-900/20 rounded-3xl text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-950/30 border border-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-500 text-[10px] font-black uppercase tracking-widest">Masterizado listo</span>
              </div>
              
              <a 
                href={processedUrl} 
                download={`EzehCut_${file?.name}`}
                className="flex items-center justify-center gap-3 w-full py-5 bg-white hover:bg-zinc-200 text-black font-black rounded-2xl transition-all shadow-xl"
              >
                <Download size={20} /> DESCARGAR RESULTADO
              </a>
              
              <button onClick={() => {setFile(null); setProcessedUrl(null);}} className="text-zinc-500 text-xs hover:text-white underline transition-colors">
                Procesar un nuevo archivo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-white">Configuración</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-zinc-900 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-6">
               <div className="space-y-2">
                 <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-1">API Endpoint</p>
                 <input 
                  type="text" 
                  value={apiUrl} 
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-sm font-mono text-red-500 outline-none focus:border-red-600 transition-all"
                />
               </div>
               <button 
                onClick={() => { localStorage.setItem('ezehcut_api_url', apiUrl); setShowSettings(false); }}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-700 shadow-lg shadow-red-600/10"
              >
                <Save size={18} /> GUARDAR CAMBIOS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
