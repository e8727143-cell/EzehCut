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
      setStatus('Sincronizando Enjambre para Ataque Paralelo...');
      const arrayBuffer = await file.arrayBuffer();
      const chunkSize = 1024 * 1024; // 1MB para fluidez
      const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);
      const results = new Array(totalChunks);
      let completedChunks = 0;

      // PROCESAMIENTO PARALELO: Lanza hasta 8 peticiones simultáneas
      const processChunk = async (chunkIdx) => {
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
          
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const data = JSON.parse(decoder.decode(value).replace('data: ', ''));
            if (data.audio) {
              const binaryString = window.atob(data.audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let j = 0; j < binaryString.length; j++) bytes[j] = binaryString.charCodeAt(j);
              results[chunkIdx] = bytes;
            }
          }
          
          completedChunks++;
          setProgress(Math.round((completedChunks / totalChunks) * 100));
          setStatus(`Procesado bloque ${completedChunks}/${totalChunks} (Multihilo activado)`);
        } catch (e) {
          // Reintento simple en caso de fallo de red
          await processChunk(chunkIdx);
        } finally {
          setServerStatus(prev => {
            const next = [...prev];
            next[serverIdx] = 'idle';
            return next;
          });
        }
      };

      // LANZAMIENTO INICIAL: Llena los 8 servidores de golpe
      const pool = [];
      for (let i = 0; i < totalChunks; i++) {
        pool.push(processChunk(i));
        // Limitamos a 8 peticiones concurrentes reales para no saturar el navegador
        if (pool.length >= 8 || i === totalChunks - 1) {
          await Promise.race(pool); 
        }
      }
      await Promise.all(pool);

      // Ensamblaje final
      setStatus('Ensamblando Master Final...');
      const totalLength = results.reduce((acc, curr) => acc + curr.length, 0);
      const finalArray = new Uint8Array(totalLength);
      let offset = 0;
      for (const res of results) {
        finalArray.set(res, offset);
        offset += res.length;
      }

      setProcessedBlobUrl(URL.createObjectURL(new Blob([finalArray], { type: 'audio/mpeg' })));
      setIsProcessing(false);
    } catch (err) {
      setError("Fallo crítico en el ataque paralelo.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center font-sans selection:bg-red-600">
      <div className="w-full max-w-2xl bg-zinc-950 border-2 border-red-600/20 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(220,38,38,0.1)] relative">
        <div className="flex justify-between items-start mb-12">
          <div className="flex items-center gap-3">
            <Zap className="text-red-600 animate-pulse" size={32} />
            <h1 className="text-4xl font-black italic tracking-tighter">EZEHCUT <span className="text-red-600">ENJAMBRE V3</span></h1>
          </div>
          <div className="text-right flex flex-col items-end">
             <div className="flex items-center gap-2 text-green-500 text-[10px] font-black border border-green-500/30 px-3 py-1 rounded-full bg-green-500/5">
                <ShieldCheck size={12} /> PARALLEL SWARM ACTIVE
             </div>
             <span className="text-[9px] text-zinc-600 mt-2 font-mono uppercase tracking-widest">8 Nodos / 4GB RAM</span>
          </div>
        </div>

        <div className="space-y-8">
          {!isProcessing && !processedBlobUrl && (
            <label className="group border-2 border-dashed border-zinc-800 hover:border-red-600 rounded-[2.5rem] p-24 flex flex-col items-center justify-center cursor-pointer bg-zinc-900/5 transition-all">
              <Upload className="w-16 h-16 mb-6 text-zinc-800 group-hover:text-red-600 group-hover:-translate-y-2 transition-all" />
              <p className="text-zinc-500 font-bold text-xl uppercase tracking-tighter">Cargar Audio/Video Pesado</p>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          )}

          {isProcessing && (
            <div className="py-6 space-y-10">
              <div className="grid grid-cols-4 gap-4">
                {serverStatus.map((s, i) => (
                  <div key={i} className={`h-16 rounded-2xl flex flex-col items-center justify-center border transition-all ${s === 'working' ? 'bg-red-600/20 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-zinc-900/40 border-zinc-800'}`}>
                    <Cpu size={16} className={s === 'working' ? 'text-red-500 animate-spin' : 'text-zinc-800'} />
                    <span className="text-[8px] mt-1 font-black">NODO {i+1}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-black uppercase italic">
                  <span className="text-red-600 animate-pulse tracking-widest">{status}</span>
                  <span className="text-zinc-500">{formatTime(seconds)}</span>
                </div>
                <div className="w-full bg-zinc-900 h-5 rounded-full overflow-hidden p-1.5 border border-zinc-800 shadow-inner">
                  <div className="bg-red-600 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-right text-4xl font-black tracking-tighter text-white">{progress}%</div>
              </div>
            </div>
          )}

          {file && !isProcessing && !processedBlobUrl && (
            <button onClick={processAudio} className="w-full py-7 bg-red-600 hover:bg-red-700 text-white font-black rounded-[2rem] shadow-2xl transition-all active:scale-[0.98] text-2xl italic">
              INICIAR ATAQUE PARALELO
            </button>
          )}

          {processedBlobUrl && (
            <div className="p-10 bg-green-500/5 border border-green-500/20 rounded-[3rem] text-center space-y-8">
              <div className="bg-green-500/20 inline-flex p-6 rounded-full text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <CheckCircle2 size={50}/>
              </div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">Misión Finalizada</h3>
              <a href={processedBlobUrl} download={`EzehCut_V3_${file?.name}`} className="flex items-center justify-center gap-4 w-full py-6 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all text-xl shadow-xl">
                <Download size={24} /> DESCARGAR RESULTADO FINAL
              </a>
              <button onClick={() => {setFile(null); setProcessedBlobUrl(null);}} className="text-zinc-600 text-xs font-black hover:text-white transition-colors">PROCESAR NUEVO OBJETIVO</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
