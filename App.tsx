import React, { useState, useEffect } from 'react';
import { DropZone } from './components/DropZone';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Download, AlertCircle, Loader2, Save, X, Server } from 'lucide-react';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Configuration State
  const [showSettings, setShowSettings] = useState(false);
  
  // Determine initial API URL
  const getInitialUrl = () => {
    // 1. Check LocalStorage (User Override)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ezehcut_api_url');
      if (saved) return saved;
    }
    
    // 2. Check Environment Variables (Vercel/Vite/Next)
    // We handle multiple naming conventions for maximum compatibility
    const envUrl = 
      (import.meta as any).env?.VITE_API_URL || 
      (import.meta as any).env?.NEXT_PUBLIC_API_URL || 
      (process as any).env?.NEXT_PUBLIC_API_URL ||
      (process as any).env?.REACT_APP_API_URL;

    if (envUrl) return envUrl;

    // 3. Fallback to Localhost
    return 'http://127.0.0.1:8000';
  };

  const [apiUrl, setApiUrl] = useState(getInitialUrl());

  const handleSaveSettings = (newUrl: string) => {
    // Remove trailing slash if present
    const cleanedUrl = newUrl.replace(/\/$/, '');
    setApiUrl(cleanedUrl);
    localStorage.setItem('ezehcut_api_url', cleanedUrl);
    setShowSettings(false);
    setError(null);
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setProcessedUrl(null);
    setError(null);
  };

  const processAudio = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const baseUrl = apiUrl.replace(/\/$/, '');
      console.log(`Sending request to: ${baseUrl}/process-audio`);

      const response = await fetch(`${baseUrl}/process-audio`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);
    } catch (err: any) {
      console.error(err);
      let msg = err.message;
      if (msg === "Failed to fetch") {
        msg = "Connection Refused. Check if the Backend URL is correct and the server is running.";
      }
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-200 font-sans selection:bg-red-900 selection:text-white relative">
      <Header onOpenSettings={() => setShowSettings(true)} />

      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-2xl space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter text-white">
              Silence <span className="text-red-600">Remover</span>
            </h2>
            <p className="text-neutral-500">
              Upload your audio to automatically strip silence (-35dB threshold).
            </p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
            <DropZone onFileSelect={handleFileSelect} disabled={isProcessing} />

            {file && (
              <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                  <div className="truncate pr-4">
                    <p className="font-medium text-neutral-200 truncate">{file.name}</p>
                    <p className="text-xs text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    disabled={isProcessing}
                    className="text-xs text-red-500 hover:text-red-400 disabled:opacity-50 font-mono"
                  >
                    [REMOVE]
                  </button>
                </div>

                {!processedUrl && (
                  <button
                    onClick={processAudio}
                    disabled={isProcessing}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        PROCESSING SIGNAL...
                      </>
                    ) : (
                      <>
                        INITIALIZE PROCESSING
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 rounded-lg flex flex-col items-start gap-2 text-red-400 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-bold">Processing Failed</p>
                </div>
                <p className="text-sm pl-7">{error}</p>
                <div className="pl-7 mt-1">
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="text-xs underline hover:text-white"
                  >
                    Check Server Configuration
                  </button>
                </div>
              </div>
            )}

            {processedUrl && (
              <div className="mt-6 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="p-6 bg-neutral-950 border border-green-900/30 rounded-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-green-900/5 group-hover:bg-green-900/10 transition-colors" />
                  <h3 className="text-green-500 font-bold mb-4 relative z-10 flex items-center justify-center gap-2">
                     PROCESS COMPLETE
                  </h3>
                  <a
                    href={processedUrl}
                    download={`processed_${file?.name || 'audio.mp3'}`}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-black font-bold rounded-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(22,163,74,0.3)]"
                  >
                    <Download className="w-5 h-5" />
                    DOWNLOAD RESULT
                  </a>
                  <audio controls src={processedUrl} className="w-full mt-6 opacity-80" />
                </div>
                <button 
                  onClick={() => {
                    setFile(null);
                    setProcessedUrl(null);
                  }}
                  className="mt-4 text-sm text-neutral-500 hover:text-white transition-colors"
                >
                  Process another file
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Server className="w-5 h-5 text-red-500" />
                Backend Configuration
              </h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-neutral-400 uppercase">API Endpoint URL</label>
                <input 
                  type="text" 
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://your-app.onrender.com"
                  className="w-full bg-black border border-neutral-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-600 transition-colors font-mono"
                />
                <p className="text-[10px] text-neutral-500">
                  Current: {apiUrl}
                </p>
                <p className="text-[10px] text-neutral-500">
                  Set <code>NEXT_PUBLIC_API_URL</code> in Vercel to configure this automatically.
                </p>
              </div>

              <button 
                onClick={() => handleSaveSettings(apiUrl)}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}