import React, { useState } from 'react';
import { Download, AlertCircle, Loader2, Save, X, Server, Scissors, Upload } from 'lucide-react';

// URL de Render (Backup si no hay variable de entorno)
const FALLBACK_API_URL = 'https://ezehcut.onrender.com';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const getInitialUrl = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ezehcut_api_url');
      if (saved) return saved;
    }
    return import.meta.env.VITE_API_URL || FALLBACK_API_URL;
  };

  const [apiUrl, setApiUrl] = useState(getInitialUrl());

  const handleSaveSettings = (newUrl: string) => {
    const cleanedUrl = newUrl.replace(/\/$/, '');
    setApiUrl(cleanedUrl);
    localStorage.setItem('ezehcut_api_url', cleanedUrl);
    setShowSettings(false);
  };

  const processAudio = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProcessedUrl(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${apiUrl}/process-audio`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);
    } catch (err: any) {
      setError(err.message === "Failed to fetch" 
        ? "No se pudo conectar con el servidor de Render. Despertando servidor..." 
        : err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decoración Roja */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/20 blur-[100px] rounded-full" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-4xl font-black tracking-tighter text-red-600">EZEHCUT<span className="text-white">WEB</span></h1>
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
              <Server size={20} className="text-neutral-500" />
            </button>
          </div>

          <div className="space-y-6">
            <label className="group border-2 border-dashed border-neutral-800 hover:border-red-600 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all bg-neutral-950/50">
              <Upload className="w-10 h-10 mb-4 text-neutral-600 group-hover:text-red-500 transition-colors" />
              <p className="text-neutral-400 font-medium text-center">
                {file ? file.name : 'Suelta tu audio aquí o haz clic'}
              </p>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} accept="audio/*" />
            </label>

            {file && !processedUrl && (
              <button 
                onClick={processAudio}
                disabled={isProcessing}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-600/20"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Scissors size={20} />}
                {isProcessing ? 'PROCESANDO SEÑAL...' : 'INICIAR LIMPIEZA'}
              </button>
            )}

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-sm flex gap-3 items-center">
                <AlertCircle size={20} className="shrink-0" />
                {error}
              </div>
            )}

            {processedUrl && (
              <div className="space-y-4 animate-in fade-in zoom-in-95">
                <div className="p-6 bg-black rounded-2xl border border-green-900/30 text-center">
                  <p className="text-green-500 font-bold mb-4">¡AUDIO LIMPIO!</p>
                  <a 
                    href={processedUrl} 
                    download={`EzehCut_${file?.name}`}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-green-600 hover:bg-green-500 text-black font-extrabold rounded-xl transition-transform active:scale-95"
                  >
                    <Download size={20} /> DESCARGAR RESULTADO
                  </a>
                </div>
                <button onClick={() => {setFile(null); setProcessedUrl(null);}} className="w-full text-neutral-500 text-sm hover:text-white underline">
                  Procesar otro archivo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Configuración */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-sm">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold">Configuración API</h3>
              <button onClick={() => setShowSettings(false)}><X size={20} /></button>
            </div>
            <input 
              type="text" 
              value={apiUrl} 
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-sm font-mono mb-4 focus:border-red-600 outline-none"
            />
            <button onClick={() => handleSaveSettings(apiUrl)} className="w-full bg-white text-black py-2 rounded-lg font-bold flex items-center justify-center gap-2">
              <Save size={18} /> Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
