import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Scissors, AlertCircle, CheckCircle2, Clock, Zap, ShieldCheck, Cpu } from 'lucide-react';

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
      setStatus('ATACANDO ARCHIVO...');
      const arrayBuffer = await file.arrayBuffer();
      const chunkSize = 10 * 1024 * 1024; // 10MB para aprovechar los 4GB de RAM total
      const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);
      const results = new Array(totalChunks);
      let completedChunks = 0;

      const queue = [...Array(totalChunks).keys()];
      const runners = Array(2).fill(null).map(async () => {
        while (queue.length > 0) {
          const chunkIdx = queue.shift();
          const serverIdx = chunkIdx % BACKEND_POOL.length;
          const chunkBlob = new Blob([arrayBuffer.slice(chunkIdx * chunkSize, Math.min((chunkIdx + 1) * chunkSize, arrayBuffer.byteLength))]);

          setServerStatus(prev => {
            const next = [...prev];
            next[serverIdx] = 'working';
            return next;
          });

          const formData = new FormData();
          formData.append('file', chunkBlob, 'chunk.mp3');

          try {
            const response = await fetch(`${BACKEND_POOL[serverIdx]}/process-audio`, { method: 'POST', body: formData });
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
            setStatus(`LIMPIANDO: ${completedChunks}/${totalChunks}`);
          } catch (e) {
            queue.push(chunkIdx);
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
      setStatus('ENSAMBLANDO MASTER...');
      
      const finalArray = new Uint8Array(results.reduce((acc, curr) => acc + (curr ? curr.length : 0), 0));
      let offset = 0;
      for (const res of results) { if (res) { finalArray.set(res, offset); offset += res.length; } }

      setProcessedBlobUrl(URL.createObjectURL(new Blob([finalArray], { type: 'audio/mpeg' })));
      setIsProcessing(false);
    } catch (err) {
      setError("ERROR DE CONEXIÓN.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center font-sans uppercase">
      <div className="w-full max-w-2xl bg-zinc-950 border-2 border-red-600/40 rounded-[3rem] p-12 shadow-[0_0_60px_rgba(220,38,38,0.15)] relative">
        <div className="flex justify-between items-start mb-12">
          <div className="flex items-center gap-3">
            <Zap className="text-red-600 animate-pulse" size={32} />
            <h1 className="text-4xl font-black italic tracking-tighter">EZEHCUT <span className="text-red-600">ULTRA</span></h1>
          </div>
          <div className="flex flex-col items-end gap-1">
             <div className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black italic shadow-[0_0_10px_red]">ALWAYS ACTIVE</div>
             <div className="flex items-center gap-1 text-green-500 text-[9px] font-bold tracking-widest"><ShieldCheck size={10}/> 8 NODOS OK</div>
          </div>
        </div>

        <div className="space-y-8">
          {!isProcessing && !processedBlobUrl && (
            <label className="border-2 border-dashed border-zinc-900 hover:border-red-600 rounded-[2.5rem] p-24 flex flex-col items-center justify-center cursor-pointer transition-all bg-zinc-900/10 group">
              <Upload className="w-16 h-16 mb-4 text-zinc-800 group-hover:text-red-600 group-hover:-translate-y-2 transition-all" />
              <p className="text-zinc-600 font-black tracking-widest text-xs">SOLTAR ARCHIVO AQUÍ</p>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          )}

          {isProcessing && (
            <div className="space-y-10 animate-in fade-in">
              <div className="grid grid-cols-8 gap-2">
                {serverStatus.map((s, i) => (
                  <div key={i} className={`h-8 rounded-lg border flex items-center justify-center transition-all ${s === 'working' ? 'bg-red-600 border-red-400 shadow-[0_0_10px_red]' : 'bg-zinc-900 border-zinc-800 opacity-20'}`}>
                    <Cpu size={12} className={s === 'working' ? 'text-white' : 'text-zinc-800'} />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <div className="flex justify-between font-black text-[10px] text-red-600 tracking-[0.3em] italic">
                  <span>{status}</span>
                  <span>{formatTime(seconds)}</span>
                </div>
                <div className="w-full bg-zinc-900 h-8 rounded-full overflow-hidden p-1.5 border border-zinc-800">
                  <div className="bg-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-8xl font-black text-center tracking-tighter italic">{progress}%</div>
              </div>
            </div>
          )}

          {file && !isProcessing && !processedBlobUrl && (
            <button onClick={processAudio} className="w-full py-8 bg-red-600 hover:bg-red-700 text-white font-black rounded-[2rem] text-3xl italic shadow-2xl active:scale-95 transition-all">
              TRITURAR SILENCIOS
            </button>
          )}

          {processedBlobUrl && (
            <div className="text-center space-y-10 py-4 animate-in zoom-in-95">
              <CheckCircle2 className="mx-auto text-green-500" size={80}/>
              <h3 className="text-4xl font-black italic tracking-tighter">MISIÓN COMPLETADA</h3>
              <a href={processedBlobUrl} download={`EzehCut_Ultra_${file?.name}`} className="flex items-center justify-center gap-4 w-full py-8 bg-white text-black font-black rounded-3xl text-2xl shadow-2xl hover:bg-zinc-200 transition-all">
                <Download size={28} /> DESCARGAR MASTER
              </a>
              <button onClick={() => {setFile(null); setProcessedBlobUrl(null); setProgress(0); setSeconds(0);}} className="text-zinc-600 text-xs font-black underline decoration-red-600 underline-offset-8">PROCESAR OTRO</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
