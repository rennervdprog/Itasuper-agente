import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  Loader2 
} from 'lucide-react';
import { RepoFileItem } from '../../types';
import { FileIcon } from './FileIcon';

interface TreeNodeProps {
  item: RepoFileItem;
  level: number;
  selectedFilePath: string | null;
  onSelectFile: (file: RepoFileItem) => void;
  fetchChildren: (dirPath: string) => Promise<RepoFileItem[]>;
  childrenCache: Record<string, RepoFileItem[]>;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  item,
  level,
  selectedFilePath,
  onSelectFile,
  fetchChildren,
  childrenCache
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isDir = item.type === 'dir';
  const isSelected = selectedFilePath === item.path;
  const children = childrenCache[item.path] || [];

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDir) {
      onSelectFile(item);
      return;
    }

    // If collapsing
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    // If expanding
    setIsExpanded(true);

    // If children not yet loaded in cache, fetch them
    if (!childrenCache[item.path]) {
      setIsLoading(true);
      setError(null);
      try {
        await fetchChildren(item.path);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar diretório');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const paddingLeft = `${level * 16 + 8}px`;

  return (
    <div>
      <div
        onClick={handleToggle}
        style={{ paddingLeft }}
        className={`group flex items-center gap-1.5 py-1.5 pr-2.5 rounded-lg text-xs font-mono cursor-pointer transition-colors select-none ${
          isSelected
            ? 'bg-emerald-500/15 text-emerald-300 font-semibold border-l-2 border-l-emerald-500'
            : isDir
            ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
        }`}
      >
        {/* Expand/Collapse Chevron for directories */}
        {isDir ? (
          <div className="w-4 h-4 flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-zinc-200">
            {isLoading ? (
              <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
            ) : isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </div>
        ) : (
          <div className="w-4 h-4 shrink-0" />
        )}

        {/* Directory or File Icon */}
        {isDir ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
          )
        ) : (
          <FileIcon filename={item.name} className="w-4 h-4 shrink-0" />
        )}

        {/* File / Directory Name */}
        <span className="truncate flex-1">{item.name}</span>

        {/* Optional Size Badge on hover */}
        {!isDir && item.size !== undefined && (
          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-500 transition-opacity shrink-0">
            {item.size < 1024 ? `${item.size}B` : `${(item.size / 1024).toFixed(0)}K`}
          </span>
        )}
      </div>

      {/* Expanded Children */}
      {isDir && isExpanded && (
        <div>
          {isLoading && !children.length && (
            <div 
              style={{ paddingLeft: `${(level + 1) * 16 + 12}px` }}
              className="py-1 flex items-center gap-2 text-[11px] text-zinc-500"
            >
              <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
              <span>Carregando pasta...</span>
            </div>
          )}

          {error && (
            <div 
              style={{ paddingLeft: `${(level + 1) * 16 + 12}px` }}
              className="py-1 text-[11px] text-red-400"
            >
              {error}
            </div>
          )}

          {children.map(child => (
            <TreeNode
              key={child.path}
              item={child}
              level={level + 1}
              selectedFilePath={selectedFilePath}
              onSelectFile={onSelectFile}
              fetchChildren={fetchChildren}
              childrenCache={childrenCache}
            />
          ))}

          {!isLoading && !error && children.length === 0 && (
            <div 
              style={{ paddingLeft: `${(level + 1) * 16 + 12}px` }}
              className="py-1 text-[11px] text-zinc-500 italic"
            >
              (pasta vazia)
            </div>
          )}
        </div>
      )}
    </div>
  );
};
