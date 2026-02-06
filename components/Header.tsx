import React from 'react';
import { Scissors, Zap, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="w-full border-b border-neutral-900 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-default">
          <div className="relative">
            <Scissors className="w-6 h-6 text-red-600 transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
            <Zap className="w-3 h-3 text-white absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold tracking-widest">
            EZEH<span className="text-red-600">CUT</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenSettings}
            className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-full transition-all"
            title="Server Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-neutral-500 border border-neutral-900 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            SYSTEM ONLINE
          </div>
        </div>
      </div>
    </header>
  );
};