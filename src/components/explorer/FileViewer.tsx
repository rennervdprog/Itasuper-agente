import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  FileCode, 
  ArrowLeft, 
  ExternalLink, 
  Download,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { FileIcon } from './FileIcon';

interface FileViewerProps {
  filePath: string;
  repoName: string;
  content: string | null;
  size?: number;
  sha?: string;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  isMobileFullscreen?: boolean;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  filePath,
  repoName,
  content,
  size,
  sha,
  loading,
  error,
  onClose,
  isMobileFullscreen = false
}) => {
  const [copied, setCopied] = useState(false);

  const filename = filePath.split('/').pop() || filePath;

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const lines = content !== null ? content.split('\n') : [];

  return (
    <div 
      className={`flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-none md:rounded-2xl overflow-hidden shadow-2xl ${
        isMobileFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full'
      }`}
    >
      {/* Header Bar */}
      <div className="min-h-[56px] px-3 sm:px-5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Back button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60"
            aria-label="Voltar para a árvore"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <FileIcon filename={filename} className="w-4 h-4 shrink-0" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-zinc-100 truncate font-mono">
                {filename}
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                {filePath.includes('.') ? filePath.split('.').pop() : 'txt'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate font-mono">
              {repoName} • <span className="text-zinc-500">{filePath}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {size !== undefined && (
            <span className="hidden sm:inline-block text-xs font-mono text-zinc-400 bg-zinc-950/80 px-2 py-1 rounded-lg border border-zinc-800">
              {formatBytes(size)}
            </span>
          )}

          <button
            onClick={handleCopy}
            disabled={loading || !content}
            className="min-h-[36px] min-w-[36px] sm:px-3 py-1.5 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors border border-zinc-700/80 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Copiar conteúdo"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-emerald-400 font-semibold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Copiar</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Fechar visualizador"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Code Area */}
      <div className="flex-1 min-h-0 overflow-auto bg-zinc-950 p-0 font-mono text-xs select-text">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-400">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
            <p className="text-sm font-medium text-zinc-300">Buscando conteúdo do arquivo no GitHub...</p>
            <p className="text-xs text-zinc-500 mt-1">{filePath}</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-200">Falha ao carregar arquivo</h4>
            <p className="text-xs text-red-400/90 max-w-md mt-1 mb-4 leading-relaxed">{error}</p>
          </div>
        ) : content === null ? (
          <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
            Nenhum conteúdo carregado.
          </div>
        ) : (
          <div className="min-w-full inline-block py-3">
            {lines.map((line, idx) => (
              <div 
                key={idx} 
                className="flex items-start hover:bg-zinc-900/60 transition-colors leading-5 px-3"
              >
                {/* Line number */}
                <span className="w-10 sm:w-12 pr-4 text-right select-none text-zinc-600 font-mono text-[11px] shrink-0">
                  {idx + 1}
                </span>
                {/* Line text */}
                <span className="flex-1 text-zinc-200 whitespace-pre font-mono text-xs overflow-visible break-all sm:break-normal">
                  {line || ' '}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-zinc-900/70 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono shrink-0">
        <div className="flex items-center gap-3">
          <span>{lines.length} linhas</span>
          {sha && <span className="hidden sm:inline text-zinc-500">SHA: {sha.slice(0, 7)}</span>}
        </div>
        <span className="text-emerald-400 text-[10px] uppercase font-semibold">Modo Somente Leitura</span>
      </div>
    </div>
  );
};
