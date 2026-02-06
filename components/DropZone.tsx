import React, { useState, useCallback } from 'react';
import { UploadCloud, FileAudio, X } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateAndSelect = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      setDragError("Invalid format. Please upload an audio file.");
      return;
    }
    setDragError(null);
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [disabled, onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div className="relative group">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300
          ${disabled ? 'opacity-50 cursor-not-allowed bg-neutral-900/20 border-neutral-800' : 'cursor-pointer'}
          ${isDragging 
            ? 'border-red-500 bg-red-950/10 scale-[1.02]' 
            : 'border-neutral-700 bg-neutral-900/30 hover:border-red-500/50 hover:bg-neutral-800/50'
          }
        `}
      >
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center gap-4 text-center p-6 pointer-events-none">
          <div className={`
            p-4 rounded-full transition-all duration-300
            ${isDragging ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400 group-hover:text-red-500'}
          `}>
            {isDragging ? <UploadCloud className="w-8 h-8" /> : <FileAudio className="w-8 h-8" />}
          </div>
          
          <div className="space-y-1">
            <p className="font-bold text-lg text-neutral-300">
              {isDragging ? "DROP AUDIO HERE" : "Drag & Drop Audio"}
            </p>
            <p className="text-sm text-neutral-500">
              or click to browse system files
            </p>
          </div>
          
          <div className="text-xs font-mono text-neutral-600 border border-neutral-800 rounded px-2 py-1">
            SUPPORTS: MP3, WAV, FLAC, OGG
          </div>
        </div>
      </div>

      {dragError && (
        <div className="absolute -bottom-12 left-0 right-0 flex items-center justify-center text-red-500 text-sm font-medium animate-pulse">
          <X className="w-4 h-4 mr-2" />
          {dragError}
        </div>
      )}
    </div>
  );
};