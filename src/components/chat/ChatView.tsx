import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  Globe, 
  Smartphone, 
  Bike, 
  Layers, 
  Code, 
  ArrowRight,
  RefreshCw,
  GitBranch,
  FileCode,
  CheckCircle2
} from 'lucide-react';
import { ChatMessage, RepositoryId, RepositoryInfo, Job } from '../../types';
import { MessageItem } from './MessageItem';
import { PROMPT_SUGGESTIONS } from '../../data/mockData';
import { cn } from '../../lib/utils';

interface ChatViewProps {
  messages: ChatMessage[];
  repositories: RepositoryInfo[];
  activeRepoId: RepositoryId;
  onSelectRepo: (id: RepositoryId) => void;
  onSendMessage: (content: string, repoId: RepositoryId) => void;
  jobs: Job[];
  onOpenJob: (jobId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  repositories,
  activeRepoId,
  onSelectRepo,
  onSendMessage,
  jobs,
  onOpenJob
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeRepo = repositories.find(r => r.id === activeRepoId) || repositories[0];
  const suggestions = PROMPT_SUGGESTIONS[activeRepoId] || [];

  // Filter messages for current repo or global initial messages
  const filteredMessages = messages.filter(
    m => m.repositoryId === activeRepoId || m.id === 'msg-init-1'
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const messageText = inputText.trim();
    setInputText('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsTyping(true);
    onSendMessage(messageText, activeRepoId);

    // Simulate Agent processing delay
    setTimeout(() => {
      setIsTyping(false);
    }, 900);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const getRepoBadgeColor = (type: string) => {
    if (type === 'web') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
    if (type === 'app cliente') return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
    return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100">
      {/* Top Repository Context Banner */}
      <div className="bg-zinc-900/60 border-b border-zinc-800/80 px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400">Repositório Selecionado:</span>
            <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full border', getRepoBadgeColor(activeRepo.type))}>
              {activeRepo.displayName}
            </span>
          </div>
          <span className="text-xs text-zinc-400 hidden md:inline">
            • {activeRepo.description}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-mono">branch: {activeRepo.defaultBranch}</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-200">
                Inicie uma conversa para {activeRepo.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Envie uma mensagem solicitando código, correções ou melhorias. Um registro de job será criado automaticamente.
              </p>
            </div>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const linkedJob = msg.jobId ? jobs.find(j => j.id === msg.jobId) : undefined;
            return (
              <MessageItem
                key={msg.id}
                message={msg}
                repository={repositories.find(r => r.id === msg.repositoryId)}
                job={linkedJob}
                onOpenJob={onOpenJob}
              />
            );
          })
        )}

        {isTyping && (
          <div className="flex gap-3 max-w-4xl w-full mx-auto py-2 px-2 items-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl">
              <span className="text-xs text-zinc-400">Agente ItaSuper analisando repositório e registrando Job...</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-6 py-2 bg-zinc-900/40 border-t border-zinc-800/60 overflow-x-auto">
        <div className="flex items-center gap-2 max-w-4xl mx-auto text-xs">
          <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Sugestões rápidas:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(sug);
                  textareaRef.current?.focus();
                }}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs transition-all cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative bg-zinc-950 border border-zinc-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/50 rounded-2xl p-2 transition-all">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={`Instrua o Agente sobre o repositório ${activeRepo.name}... (Enter para enviar)`}
              rows={1}
              className="w-full bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 resize-none outline-none max-h-44 min-h-[44px]"
            />

            <div className="flex items-center justify-between pt-2 px-2 border-t border-zinc-800/60 text-xs">
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1 font-mono">
                  <span className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">Enter</span> envia
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <span className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">Shift + Enter</span> quebra linha
                </span>
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs rounded-xl shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <span>Enviar</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
