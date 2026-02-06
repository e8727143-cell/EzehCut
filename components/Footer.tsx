import React from 'react';
import { Github, Code2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-neutral-900 bg-black py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-neutral-600 text-sm font-mono">
          © {new Date().getFullYear()} EZEHCUT AUDIO LABS. ALL RIGHTS RESERVED.
        </p>
        
        <div className="flex items-center gap-6">
          <a href="#" className="text-neutral-600 hover:text-red-500 transition-colors flex items-center gap-2 text-sm">
            <Github className="w-4 h-4" />
            <span>Source</span>
          </a>
          <a href="#" className="text-neutral-600 hover:text-red-500 transition-colors flex items-center gap-2 text-sm">
            <Code2 className="w-4 h-4" />
            <span>API Docs</span>
          </a>
        </div>
      </div>
    </footer>
  );
};