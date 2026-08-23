export type RepositoryId = 
  | 'ifood-style-landing'
  | 'Itasuper-APP-NATIVO'
  | 'Itasuper-entregador-';

export type JobStatus = 
  | 'pending'
  | 'running'
  | 'pr_aberto'
  | 'concluido'
  | 'erro';

export interface RepositoryInfo {
  id: RepositoryId;
  name: string;
  displayName: string;
  type: 'web' | 'app cliente' | 'app entregador';
  description: string;
  techStack: string[];
  defaultBranch: string;
  iconName: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  repositoryId: RepositoryId;
  createdAt: string;
  jobId?: string;
  codeSnippets?: { language: string; code: string; filename?: string }[];
}

export interface JobLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface Job {
  id: string;
  repositoryId: RepositoryId;
  originalMessage: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  summary?: string;
  branchName?: string;
  prUrl?: string;
  prNumber?: number;
  filesModified?: string[];
  logs?: JobLog[];
  errorMessage?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}
