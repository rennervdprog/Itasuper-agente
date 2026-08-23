import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listFiles, resolveRepoTarget } from './_github';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token || token === 'your-fine-grained-pat-here') {
    return res.status(401).json({
      ok: false,
      error: 'GITHUB_TOKEN não configurado nas variáveis de ambiente do backend.',
      hint: 'Cadastre a chave GITHUB_TOKEN no painel Secrets do AI Studio / Vercel.'
    });
  }

  const targetRepo = (req.query.repo as string) || 'ifood-style-landing';

  try {
    const { owner, repo, defaultBranch } = resolveRepoTarget(targetRepo);
    const files = await listFiles(targetRepo, '', defaultBranch);

    return res.status(200).json({
      ok: true,
      message: 'Conexão com a API do GitHub realizada com sucesso!',
      repository: `${owner}/${repo}`,
      branch: defaultBranch,
      totalFiles: files.length,
      files: files.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        path: f.path,
        html_url: f.html_url
      }))
    });
  } catch (error: any) {
    console.error('[GitHub Test Error]', error);
    const status = error.status || 500;
    return res.status(status).json({
      ok: false,
      error: error.message || 'Falha ao comunicar com a API do GitHub',
      status: error.status,
      documentation_url: error.response?.data?.documentation_url
    });
  }
}
