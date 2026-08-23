import React from 'react';
import { 
  FileCode, 
  FileText, 
  FileJson, 
  FileSpreadsheet, 
  FileImage, 
  FileCog, 
  File, 
  Layers, 
  Code2,
  Terminal,
  FileCheck
} from 'lucide-react';

interface FileIconProps {
  filename: string;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ filename, className = 'w-4 h-4' }) => {
  const lower = filename.toLowerCase();

  // Especial files
  if (lower === 'package.json' || lower === 'bun.lockb' || lower === 'package-lock.json') {
    return <FileJson className={`${className} text-amber-400 shrink-0`} />;
  }
  if (lower.startsWith('.env')) {
    return <FileCog className={`${className} text-yellow-500 shrink-0`} />;
  }
  if (lower.endsWith('.md') || lower.endsWith('.txt') || lower.startsWith('readme')) {
    return <FileText className={`${className} text-sky-400 shrink-0`} />;
  }
  if (lower.endsWith('.tsx') || lower.endsWith('.jsx')) {
    return <Code2 className={`${className} text-cyan-400 shrink-0`} />;
  }
  if (lower.endsWith('.ts') || lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) {
    return <FileCode className={`${className} text-blue-400 shrink-0`} />;
  }
  if (lower.endsWith('.json')) {
    return <FileJson className={`${className} text-amber-400 shrink-0`} />;
  }
  if (lower.endsWith('.css') || lower.endsWith('.scss') || lower.endsWith('.postcss')) {
    return <Layers className={`${className} text-pink-400 shrink-0`} />;
  }
  if (lower.endsWith('.html') || lower.endsWith('.xml')) {
    return <FileCode className={`${className} text-orange-400 shrink-0`} />;
  }
  if (lower.endsWith('.svg') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.endsWith('.ico')) {
    return <FileImage className={`${className} text-emerald-400 shrink-0`} />;
  }
  if (lower.endsWith('.sh') || lower.endsWith('.bash') || lower.endsWith('.zsh')) {
    return <Terminal className={`${className} text-emerald-400 shrink-0`} />;
  }
  if (lower.endsWith('.yml') || lower.endsWith('.yaml')) {
    return <FileCog className={`${className} text-rose-400 shrink-0`} />;
  }
  if (lower.includes('test') || lower.includes('spec')) {
    return <FileCheck className={`${className} text-purple-400 shrink-0`} />;
  }

  return <File className={`${className} text-zinc-400 shrink-0`} />;
};
