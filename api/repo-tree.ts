import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listFiles, getFileContent, resolveRepoTarget } from './_github';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token || token === 'your-fine-grained-pat-here') {
    return res.status(401).json({
      ok: false,
      error: 'GITHUB_TOKEN não configurado no backend. Configure o token no Secrets/Vercel.',
      hint: 'Cadastre a chave GITHUB_TOKEN no painel de ambiente.'
    });
  }

  const repoParam = (req.query.repo as string) || 'ifood-style-landing';
  const pathParam = (req.query.path as string) || '';
  const actionParam = (req.query.action as string) || (req.query.type === 'content' ? 'content' : 'list');

  try {
    const { owner, repo, defaultBranch } = resolveRepoTarget(repoParam);

    // Modo 1: Obter conteúdo completo de um arquivo
    if (actionParam === 'content') {
      if (!pathParam) {
        return res.status(400).json({ ok: false, error: 'Parâmetro path é obrigatório para ler o conteúdo de um arquivo.' });
      }

      const fileData = await getFileContent(repoParam, pathParam, defaultBranch);
      return res.status(200).json({
        ok: true,
        repository: `${owner}/${repo}`,
        branch: defaultBranch,
        path: fileData.path,
        content: fileData.content,
        size: fileData.size,
        sha: fileData.sha
      });
    }

    // Modo 2: Listar pastas e arquivos de um diretório
    const items = await listFiles(repoParam, pathParam, defaultBranch);

    // Ordenação: Diretórios primeiro em ordem alfabética, depois arquivos em ordem alfabética
    const sortedItems = items.sort((a, b) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return res.status(200).json({
      ok: true,
      repository: `${owner}/${repo}`,
      branch: defaultBranch,
      path: pathParam,
      totalItems: sortedItems.length,
      items: sortedItems
    });
  } catch (error: any) {
    console.error(`[RepoTree Error] Repo: ${repoParam}, Path: ${pathParam}:`, error);
    const status = error.status || 500;
    return res.status(status).json({
      ok: false,
      error: error.message || 'Falha ao consultar árvore do repositório no GitHub',
      status: error.status
    });
  }
}
