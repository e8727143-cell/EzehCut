import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Scissors, AlertCircle, Loader2, Server, X, CheckCircle2, Clock, Activity, Zap, ShieldCheck, Cpu } from 'lucide-react';

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
    
    try {
      setStatus('Preparando Motores de Fuerza Bruta...');
      const arrayBuffer = await file.arrayBuffer();
      // AUMENTO DE BLOQUE: 10MB para reducir latencia de red
      const chunkSize = 10 * 1024 * 1024; 
      const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);
      const results = new Array(totalChunks);
      let completedChunks = 0;

      // Procesador de cola para limitar a 2 conexiones simultáneas (más estable)
      const queue = [...Array(totalChunks).keys()];
      const runners = Array(2).fill(null).map(async (_, runnerIdx) => {
        while (queue.length > 0) {
          const chunkIdx = queue.shift();
          const serverIdx = chunkIdx % BACKEND_POOL.length;
          const start = chunkIdx * chunkSize;
          const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
          const chunkBlob = new Blob([arrayBuffer.slice(start, end)]);

          setServerStatus(prev => {
            const next = [...prev];
            next[serverIdx] = 'working';
            return next;
          });

          const formData = new FormData();
          formData.append('file', chunkBlob, 'chunk.mp3');

          try {
            const response = await fetch(`${BACKEND_POOL[serverIdx]}/process-audio`, {
              method: 'POST',
              body: formData,
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let audioPart = '';
            
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              const data = JSON.parse(decoder.decode(value).replace('data: ', ''));
              if (data.audio) audioPart = data.audio;
            }
            
            if (audioPart) {
              const binaryString = window.atob(audioPart);
              const bytes = new Uint8Array(binaryString.length);
              for (let j = 0; j < binaryString.length; j++) bytes[j] = binaryString.charCodeAt(j);
              results[chunkIdx] = bytes;
            }

            completedChunks++;
            setProgress(Math.round((completedChunks / totalChunks) * 100));
            setStatus(`Procesado pesado: ${completedChunks}/${totalChunks}`);
          } catch (e) {
            queue.push(chunkIdx); // Reintentar si falla
          } finally {
            setServerStatus(prev => {
              const next = [...prev];
              next[serverIdx] = 'idle';
              return next;
            });
          }
        }
      });

      await Promise.all(runners);

      setStatus('Fusionando Núcleos...');
      const totalLength = results.reduce((acc, curr) => acc + (curr ? curr.length : 0), 0);
      const finalArray = new Uint8Array(totalLength);
      let offset = 0;
      for (const res of results) {
        if (res) {
          finalArray.set(res, offset);
          offset += res.length;
        }
      }

      setProcessedBlobUrl(URL.createObjectURL(new Blob([finalArray], { type: 'audio/mpeg' })));
      setIsProcessing(false);
    } catch (err) {
      setError("Fallo en la red del enjambre.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-[3rem] p-12 shadow-2xl relative">
        <div className="flex justify-between items-start mb-12">
          <div className="flex items-center gap-3">
            <Zap className="text-red-600" size={32} />
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">EzehCut <span className="text-red-600">V3.1</span></h1>
          </div>
          <div className="bg-red-600/10 border border-red-600/40 px-4 py-2 rounded-2xl text-[10px] font-black text-red-500">
             BRUTE FORCE MODE
          </div>
        </div>

        <div className="space-y-8">
          {!isProcessing && !processedBlobUrl && (
            <label className="border-2 border-dashed border-zinc-800 hover:border-red-600 rounded-[2.5rem] p-24 flex flex-col items-center justify-center cursor-pointer transition-all">
              <Upload className="w-16 h-16 mb-4 text-zinc-800" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Cargar archivo de una hora</p>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          )}

          {isProcessing && (
            <div className="space-y-10">
              <div className="grid grid-cols-4 gap-4">
                {serverStatus.map((s, i) => (
                  <div key={i} className={`h-12 rounded-xl border flex items-center justify-center ${s === 'working' ? 'bg-red-600 border-red-500 shadow-[0_0_10px_red]' : 'bg-zinc-900 border-zinc-800 opacity-30'}`}>
                    <Cpu size={14} className={s === 'working' ? 'text-white animate-pulse' : 'text-zinc-700'} />
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between font-black text-xs uppercase tracking-widest text-red-600 italic">
                  <span>{status}</span>
                  <span>{formatTime(seconds)}</span>
                </div>
                <div className="w-full bg-zinc-900 h-6 rounded-full overflow-hidden p-1 border border-zinc-800">
                  <div className="bg-red-600 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-6xl font-black text-center tracking-tighter">{progress}%</div>
              </div>
            </div>
          )}

          {file && !isProcessing && !processedBlobUrl && (
            <button onClick={processAudio} className="w-full py-7 bg-red-600 hover:bg-red-700 text-white font-black rounded-[2rem] text-2xl italic tracking-tighter">
              EJECUTAR LIMPIEZA TOTAL
            </button>
          )}

          {processedBlobUrl && (
            <div className="text-center space-y-8 animate-in zoom-in-95">
              <CheckCircle2 className="mx-auto text-green-500" size={64}/>
              <h3 className="text-4xl font-black italic uppercase tracking-tighter">Proceso Exitoso</h3>
              <a href={processedBlobUrl} download={`EzehCut_Final_${file?.name}`} className="flex items-center justify-center gap-4 w-full py-6 bg-white text-black font-black rounded-2xl text-xl">
                <Download size={24} /> DESCARGAR AUDIO
              </a>
              <button onClick={() => {setFile(null); setProcessedBlobUrl(null);}} className="text-zinc-600 text-xs font-black uppercase underline decoration-red-600">Nuevo proceso</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
