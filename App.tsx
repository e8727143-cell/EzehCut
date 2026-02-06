import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Scissors, AlertCircle, Loader2, Server, X, CheckCircle2, Clock, Activity, Zap, ShieldCheck, Cpu } from 'lucide-react';

// EL ENJAMBRE DEFINITIVO: 8 Nodos Sincronizados
const BACKEND_POOL = [
  'https://ezehcut.onrender.com', 
  'https://ezehcut-n1ad.onrender.com',
  'https://ezehcut-kozi.onrender.com',
  'https://ezehcut-eco3.onrender.com',
  'https://ezehcut-vmey.onrender.com',
  'https://ezehcut-hrgx.onrender.com',
  'https://ezehcut-06iu.onrender.com',
  'https://ezehcut-rzvk.onrender.com'
];

export default function App() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [processedBlobUrl, setProcessedBlobUrl] = useState(null);
  const [error, setError] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [activeServer, setActiveServer] = useState(null);
  const [serverStatus, setServerStatus] = useState(new Array(8).fill('idle'));
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
    setServerStatus(new Array(8).fill('idle'));
    
    try {
      setStatus('Iniciando micro-fragmentación...');
      const arrayBuffer = await file.arrayBuffer();
      const totalSize = arrayBuffer.byteLength;
      
      // OPTIMIZACIÓN: Bloques de 1MB para flujo constante y ultra-rápido
      const chunkSize = 1024 * 1024; 
      const chunks = Math.ceil(totalSize / chunkSize);
      let combinedBytes = new Uint8Array(0);

      for (let i = 0; i < chunks; i++) {
        const serverIndex = i % BACKEND_POOL.length;
        const targetBackend = BACKEND_POOL[serverIndex];
        
        setActiveServer(serverIndex);
        setServerStatus(prev => {
          const next = [...prev];
          next[serverIndex] = 'working';
          return next;
        });

        setStatus(`[Nodo ${serverIndex + 1}] Procesando fragmento ${i + 1}/${chunks}...`);
        setProgress(Math.round((i / chunks) * 100));

        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, totalSize);
        const chunk = arrayBuffer.slice(start, end);

        const formData = new FormData();
        formData.append('file', new Blob([chunk]), 'chunk.mp3');

        try {
          const response = await fetch(`${targetBackend}/process-audio`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error();

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const decoded = decoder.decode(value);
            const lines = decoded.split('\n');
            for (const line of lines) {
              if (line.trim().startsWith('data: ')) {
                const data = JSON.parse(line.replace('data: ', ''));
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
          }
          setServerStatus(prev => {
            const next = [...prev];
            next[serverIndex] = 'idle';
            return next;
          });

        } catch (e) {
          setServerStatus(prev => {
            const next = [...prev];
            next[serverIndex] = 'error';
            return next;
          });
          i--; // Reintentar el mismo bloque en el siguiente nodo
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
      }

      const finalBlob = new Blob([combinedBytes], { type: 'audio/mpeg' });
      setProcessedBlobUrl(URL.createObjectURL(finalBlob));
      setProgress(100);
      setStatus('¡Proceso completado!');
      setActiveServer(null);
    } catch (err) {
      setError("Fallo crítico en el Enjambre.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-[3rem] p-12 shadow-2xl relative border-t-red-600">
        
        <div className="flex justify-between items-center mb-12 relative z-10">
          <div className="flex items-center gap-3">
            <Zap className="text-red-600 animate-pulse" size={28} />
            <h1 className="text-4xl font-black italic tracking-tighter">EZEHCUT <span className="text-red-600">ENJAMBRE</span></h1>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black text-red-600 uppercase tracking-widest italic">Nave Nodriza v2.1</div>
             <div className="flex items-center gap-1 text-green-500 text-[9px] font-bold">
                <ShieldCheck size={10} /> 8 NODOS / 4GB RAM
             </div>
          </div>
        </div>

        <div className="space-y-8 relative z-10">
          {!isProcessing && !processedBlobUrl && (
            <label className="group border-2 border-dashed border-zinc-800 hover:border-red-600 rounded-[2.5rem] p-20 flex flex-col items-center justify-center cursor-pointer bg-zinc-900/5 transition-all">
              <Upload className="w-14 h-14 mb-6 text-zinc-700 group-hover:text-red-600 transition-all" />
              <p className="text-zinc-400 font-bold text-lg">{file ? file.name : 'Subir audio de larga duración'}</p>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          )}

          {isProcessing && (
            <div className="py-6 space-y-10 animate-in fade-in">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Estado de Misión</p>
                     <p className="text-lg font-bold text-white tracking-tight">{status}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black tracking-tighter">{progress}%</span>
                    <div className="flex items-center justify-end gap-2 text-zinc-500 text-xs font-mono">
                      <Clock size={12}/> {formatTime(seconds)}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-800">
                  <div className="bg-red-600 h-full rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.5)]" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Monitor de Nodos */}
              <div className="grid grid-cols-4 gap-4 p-6 bg-black/40 border border-zinc-900 rounded-3xl">
                {BACKEND_POOL.map((_, i) => (
                  <div key={i} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${activeServer === i ? 'border-red-600 bg-red-600/10' : 'border-zinc-900 bg-zinc-900/10'}`}>
                    <Cpu size={14} className={activeServer === i ? 'text-red-500 animate-pulse' : 'text-zinc-800'} />
                    <span className={`text-[7px] font-black uppercase ${activeServer === i ? 'text-white' : 'text-zinc-700'}`}>Nodo {i+1}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${serverStatus[i] === 'working' ? 'bg-red-500 shadow-[0_0_8px_red]' : serverStatus[i] === 'error' ? 'bg-orange-600' : 'bg-zinc-800'}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {file && !isProcessing && !processedBlobUrl && (
            <button onClick={processAudio} className="w-full py-6 bg-red-600 hover:bg-red-700 text-white font-black rounded-[2rem] shadow-2xl active:scale-95 transition-all text-xl italic tracking-tighter">
              INICIAR PROCESADO DE ALTA VELOCIDAD
            </button>
          )}

          {processedBlobUrl && (
            <div className="p-10 bg-green-600/5 border border-green-900/20 rounded-[3rem] text-center space-y-8 animate-in zoom-in-95">
              <CheckCircle2 className="mx-auto text-green-500" size={48}/>
              <h3 className="text-3xl font-black italic tracking-tighter">¡AUDIO LIMPIADO!</h3>
              <a href={processedBlobUrl} download={`EzehCut_Pro_${file?.name}`} className="flex items-center justify-center gap-4 w-full py-6 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all shadow-2xl text-lg">
                <Download size={22} /> DESCARGAR RESULTADO
              </a>
              <button onClick={() => {setFile(null); setProcessedBlobUrl(null); setProgress(0); setSeconds(0);}} className="text-zinc-600 text-xs hover:text-white underline underline-offset-8 font-bold uppercase tracking-widest">Procesar otro</button>
            </div>
          )}

          {error && <div className="p-6 bg-red-950/20 border border-red-900/30 rounded-3xl text-red-500 text-sm flex gap-4 items-center animate-in shake italic font-bold"> <AlertCircle size={24} /> {error}</div>}
        </div>
      </div>
    </div>
  );
}
