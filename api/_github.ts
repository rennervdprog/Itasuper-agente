import { Octokit } from 'octokit';

/**
 * Mapeamento dos repositórios do ItaSuper (Nome interno -> Owner / Repo no GitHub)
 */
export const REPOSITORY_MAP: Record<string, { owner: string; repo: string; defaultBranch: string }> = {
  'ifood-style-landing': {
    owner: 'rennervdprog',
    repo: 'ifood-style-landing',
    defaultBranch: 'main'
  },
  'itasuper-app-nativo': {
    owner: 'rennervdprog',
    repo: 'Itasuper-APP-NATIVO',
    defaultBranch: 'main'
  },
  'itasuper-entregador': {
    owner: 'rennervdprog',
    repo: 'Itasuper-entregador-',
    defaultBranch: 'main'
  },
  // Mapeamentos para variantes de IDs usados no frontend
  'Itasuper-APP-NATIVO': {
    owner: 'rennervdprog',
    repo: 'Itasuper-APP-NATIVO',
    defaultBranch: 'main'
  },
  'Itasuper-entregador-': {
    owner: 'rennervdprog',
    repo: 'Itasuper-entregador-',
    defaultBranch: 'main'
  }
};

/**
 * Obtém os detalhes de owner/repo para uma chave de repositório
 */
export function resolveRepoTarget(repoKey: string): { owner: string; repo: string; defaultBranch: string } {
  const target = REPOSITORY_MAP[repoKey];
  if (target) return target;

  const normalized = repoKey.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+$/, '');
  if (normalized.includes('nativo')) return REPOSITORY_MAP['itasuper-app-nativo'];
  if (normalized.includes('entregador')) return REPOSITORY_MAP['itasuper-entregador'];
  if (normalized.includes('landing') || normalized.includes('ifood')) return REPOSITORY_MAP['ifood-style-landing'];

  throw new Error(`Repositório não reconhecido: "${repoKey}". Use: ifood-style-landing, itasuper-app-nativo ou itasuper-entregador.`);
}

let octokitInstance: Octokit | null = null;

/**
 * Obtém instância autenticada do Octokit usando o token de backend (GITHUB_TOKEN)
 */
export function getOctokit(): Octokit {
  if (typeof window !== 'undefined') {
    throw new Error('Octokit/GITHUB_TOKEN não pode ser executado no navegador.');
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token || token === 'your-fine-grained-pat-here') {
    throw new Error('GITHUB_TOKEN não está configurado nas variáveis de ambiente do backend.');
  }

  if (!octokitInstance) {
    octokitInstance = new Octokit({ auth: token });
  }

  return octokitInstance;
}

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  size?: number;
  sha: string;
  html_url?: string;
  download_url?: string | null;
}

/**
 * 1. listFiles: Lista arquivos e diretórios de um caminho no repositório
 */
export async function listFiles(repoKey: string, path = '', ref = 'main'): Promise<FileItem[]> {
  const octokit = getOctokit();
  const { owner, repo } = resolveRepoTarget(repoKey);

  const response = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref
  });

  if (!Array.isArray(response.data)) {
    throw new Error(`O caminho "${path}" no repositório ${owner}/${repo} é um arquivo, não um diretório.`);
  }

  return response.data.map((item) => ({
    name: item.name,
    path: item.path,
    type: item.type as 'file' | 'dir' | 'symlink' | 'submodule',
    size: item.size,
    sha: item.sha,
    html_url: item.html_url,
    download_url: item.download_url
  }));
}

/**
 * 2. getFileContent: Lê o conteúdo decodificado de um arquivo específico
 */
export async function getFileContent(
  repoKey: string,
  path: string,
  ref = 'main'
): Promise<{ content: string; sha: string; path: string; size: number }> {
  const octokit = getOctokit();
  const { owner, repo } = resolveRepoTarget(repoKey);

  const response = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref
  });

  if (Array.isArray(response.data)) {
    throw new Error(`O caminho "${path}" é um diretório no repositório ${owner}/${repo}, esperado um arquivo.`);
  }

  if (response.data.type !== 'file') {
    throw new Error(`O item em "${path}" não é um arquivo regular (tipo: ${response.data.type}).`);
  }

  const rawBase64 = response.data.content || '';
  const decodedContent = Buffer.from(rawBase64, 'base64').toString('utf-8');

  return {
    content: decodedContent,
    sha: response.data.sha,
    path: response.data.path,
    size: response.data.size
  };
}

/**
 * 3. createBranch: Cria uma nova branch a partir de uma base (por padrão 'main')
 */
export async function createBranch(
  repoKey: string,
  branchName: string,
  fromBranch = 'main'
): Promise<{ ref: string; sha: string }> {
  // REGRA DE OURO: Bloqueio estrito
  if (branchName === 'main' || branchName === 'master') {
    throw new Error('REGRA DE OURO: Não é permitido recriar ou apontar branch de trabalho diretamente para a main.');
  }

  const octokit = getOctokit();
  const { owner, repo } = resolveRepoTarget(repoKey);

  // 1. Obter o SHA do commit mais recente da branch base (ex: main)
  const baseRefData = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${fromBranch}`
  });

  const latestCommitSha = baseRefData.data.object.sha;

  // 2. Criar a nova branch (refs/heads/<branchName>)
  const cleanBranch = branchName.replace(/^refs\/heads\//, '');
  const newRef = await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${cleanBranch}`,
    sha: latestCommitSha
  });

  return {
    ref: newRef.data.ref,
    sha: newRef.data.object.sha
  };
}

/**
 * 4. commitFile: Faz commit de uma alteração em um arquivo numa branch específica
 * REGRA DE OURO: Bloqueia qualquer tentativa de commit direto na main
 */
export async function commitFile(
  repoKey: string,
  branch: string,
  path: string,
  content: string,
  message: string
): Promise<{ commitSha: string; contentSha: string }> {
  const cleanBranch = branch.replace(/^refs\/heads\//, '');

  // REGRA DE OURO: O agente NUNCA commita direto na main
  if (cleanBranch === 'main' || cleanBranch === 'master') {
    throw new Error('VIOLAÇÃO DA REGRA DE OURO: Commits diretos na branch "main" são estritamente proibidos. Crie uma branch de feature e abra um Pull Request.');
  }

  const octokit = getOctokit();
  const { owner, repo } = resolveRepoTarget(repoKey);

  // Verificar se o arquivo já existe na branch de destino para obter seu SHA atual
  let currentFileSha: string | undefined;
  try {
    const existingFile = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: cleanBranch
    });

    if (!Array.isArray(existingFile.data) && existingFile.data.sha) {
      currentFileSha = existingFile.data.sha;
    }
  } catch (error: any) {
    // 404 significa que o arquivo é novo, o que é esperado ao criar arquivos
    if (error.status !== 404) {
      throw error;
    }
  }

  const base64Content = Buffer.from(content, 'utf-8').toString('base64');

  const response = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: base64Content,
    branch: cleanBranch,
    sha: currentFileSha
  });

  return {
    commitSha: response.data.commit.sha || '',
    contentSha: response.data.content?.sha || ''
  };
}

/**
 * 5. createPullRequest: Abre um Pull Request da branch de feature para a branch base (main)
 */
export async function createPullRequest(
  repoKey: string,
  branch: string,
  title: string,
  body: string,
  baseBranch = 'main'
): Promise<{ id: number; number: number; html_url: string; state: string }> {
  const cleanBranch = branch.replace(/^refs\/heads\//, '');

  if (cleanBranch === baseBranch) {
    throw new Error(`Não é possível criar Pull Request de "${cleanBranch}" para "${baseBranch}" (mesma branch).`);
  }

  const octokit = getOctokit();
  const { owner, repo } = resolveRepoTarget(repoKey);

  const response = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    body,
    head: cleanBranch,
    base: baseBranch
  });

  return {
    id: response.data.id,
    number: response.data.number,
    html_url: response.data.html_url,
    state: response.data.state
  };
}
