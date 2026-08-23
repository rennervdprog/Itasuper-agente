import React, { useState, useEffect, useCallback } from 'react';
import { 
  FolderTree, 
  RefreshCw, 
  Search, 
  AlertCircle, 
  Loader2, 
  FileCode, 
  ExternalLink,
  GitBranch,
  FolderOpen
} from 'lucide-react';
import { RepositoryId, RepositoryInfo, RepoFileItem } from '../../types';
import { api } from '../../lib/api';
import { TreeNode } from './TreeNode';
import { FileViewer } from './FileViewer';

interface FileExplorerViewProps {
  repositories: RepositoryInfo[];
  activeRepoId: RepositoryId;
  onSelectRepo: (repoId: RepositoryId) => void;
}

export const FileExplorerView: React.FC<FileExplorerViewProps> = ({
  repositories,
  activeRepoId,
  onSelectRepo
}) => {
  const [rootItems, setRootItems] = useState<RepoFileItem[]>([]);
  const [childrenCache, setChildrenCache] = useState<Record<string, RepoFileItem[]>>({});
  const [loadingRoot, setLoadingRoot] = useState<boolean>(true);
  const [rootError, setRootError] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected File Viewer State
  const [selectedFile, setSelectedFile] = useState<RepoFileItem | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | undefined>(undefined);
  const [fileSha, setFileSha] = useState<string | undefined>(undefined);
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Screen layout detection for modal vs split view
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeRepo = repositories.find(r => r.id === activeRepoId) || repositories[0];

  // Carregar arquivos da raiz quando o repositório ativo mudar
  const loadRootDirectory = useCallback(async () => {
    setLoadingRoot(true);
    setRootError(null);
    setSelectedFile(null);
    setFileContent(null);
    setChildrenCache({});

    const res = await api.getRepoTree(activeRepoId, '');
    if (res.ok && res.items) {
      setRootItems(res.items);
    } else {
      setRootError(res.error || 'Não foi possível carregar a estrutura do repositório');
      setRootItems([]);
    }
    setLoadingRoot(false);
  }, [activeRepoId]);

  useEffect(() => {
    loadRootDirectory();
  }, [loadRootDirectory]);

  // Carregamento sob demanda (lazy loading) dos nós filhos de uma pasta
  const fetchChildren = useCallback(async (dirPath: string): Promise<RepoFileItem[]> => {
    // Se já estiver em cache, retorna direto
    if (childrenCache[dirPath]) {
      return childrenCache[dirPath];
    }

    const res = await api.getRepoTree(activeRepoId, dirPath);
    if (!res.ok || !res.items) {
      throw new Error(res.error || 'Erro ao carregar diretório');
    }

    setChildrenCache(prev => ({
      ...prev,
      [dirPath]: res.items!
    }));

    return res.items;
  }, [activeRepoId, childrenCache]);

  // Abrir e carregar conteúdo de um arquivo
  const handleSelectFile = async (file: RepoFileItem) => {
    setSelectedFile(file);
    setLoadingFile(true);
    setFileError(null);
    setFileContent(null);
    setFileSize(file.size);
    setFileSha(file.sha);

    const res = await api.getFileContent(activeRepoId, file.path);
    if (res.ok && res.content !== undefined) {
      setFileContent(res.content);
      setFileSize(res.size ?? file.size);
      setFileSha(res.sha ?? file.sha);
    } else {
      setFileError(res.error || 'Não foi possível carregar o conteúdo deste arquivo.');
    }
    setLoadingFile(false);
  };

  // Filtragem rápida
  const filteredRootItems = rootItems.filter(item => 
    !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-zinc-950">
      {/* Left Column: Explorer Tree Sidebar */}
      <div className="w-full md:w-80 lg:w-96 flex flex-col border-r border-zinc-800 bg-zinc-900/50 shrink-0 h-full overflow-hidden">
        {/* Header & Filter Controls */}
        <div className="p-3 sm:p-4 border-b border-zinc-800 flex flex-col gap-2.5 shrink-0 bg-zinc-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 tracking-tight">
                Explorador de Arquivos
              </h3>
            </div>
            
            <button
              onClick={loadRootDirectory}
              disabled={loadingRoot}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
              title="Recarregar árvore do repositório"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRoot ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar arquivos..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Tree Content Area */}
        <div className="flex-1 overflow-y-auto p-2 min-h-0 space-y-0.5 select-none">
          {loadingRoot ? (
            <div className="p-6 flex flex-col items-center justify-center text-center text-zinc-400">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mb-2" />
              <p className="text-xs font-medium text-zinc-300">Conectando ao GitHub...</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Carregando estrutura de {activeRepo.name}</p>
            </div>
          ) : rootError ? (
            <div className="p-4 m-2 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-zinc-200">Falha ao listar arquivos</p>
              <p className="text-[11px] text-red-400/90 mt-1 leading-relaxed">{rootError}</p>
              <button
                onClick={loadRootDirectory}
                className="mt-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : filteredRootItems.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 text-xs">
              {searchTerm ? 'Nenhum arquivo correspondente à busca.' : 'Repositório vazio.'}
            </div>
          ) : (
            filteredRootItems.map(item => (
              <TreeNode
                key={item.path}
                item={item}
                level={0}
                selectedFilePath={selectedFile?.path || null}
                onSelectFile={handleSelectFile}
                fetchChildren={fetchChildren}
                childrenCache={childrenCache}
              />
            ))
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-2.5 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 shrink-0 font-mono">
          <div className="flex items-center gap-1.5 truncate">
            <GitBranch className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{activeRepo.defaultBranch}</span>
          </div>
          <span>{rootItems.length} itens na raiz</span>
        </div>
      </div>

      {/* Right Column / Mobile Fullscreen Modal: File Content Viewer */}
      {selectedFile ? (
        <div className="flex-1 h-full overflow-hidden p-0 md:p-3 bg-zinc-950">
          <FileViewer
            filePath={selectedFile.path}
            repoName={activeRepo.name}
            content={fileContent}
            size={fileSize}
            sha={fileSha}
            loading={loadingFile}
            error={fileError}
            onClose={() => setSelectedFile(null)}
            isMobileFullscreen={isMobile}
          />
        </div>
      ) : (
        /* Desktop Empty State Placeholder */
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-zinc-500 bg-zinc-950">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4 shadow-inner">
            <FileCode className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-300">Nenhum arquivo selecionado</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
            Selecione qualquer arquivo na árvore à esquerda para visualizar seu conteúdo, estrutura e código com formatação e numeração de linhas.
          </p>
        </div>
      )}
    </div>
  );
};
