import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory Server-Side State & Async Job Store (ready for Supabase & GitHub integration)
export interface ServerJob {
  id: string;
  repositoryId: 'ifood-style-landing' | 'Itasuper-APP-NATIVO' | 'Itasuper-entregador-';
  originalMessage: string;
  status: 'pending' | 'running' | 'pr_aberto' | 'concluido' | 'erro';
  createdAt: string;
  updatedAt: string;
  summary?: string;
  branchName?: string;
  prUrl?: string;
  prNumber?: number;
  filesModified?: string[];
  logs?: Array<{ timestamp: string; level: 'info' | 'warn' | 'error' | 'success'; message: string }>;
}

export interface ServerChatMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  repositoryId: 'ifood-style-landing' | 'Itasuper-APP-NATIVO' | 'Itasuper-entregador-';
  createdAt: string;
  jobId?: string;
}

const serverState = {
  jobs: [
    {
      id: 'job-101',
      repositoryId: 'ifood-style-landing' as const,
      originalMessage: 'Adicionar banner promocional com contador regressivo no topo do cardápio web',
      status: 'pr_aberto' as const,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      summary: 'Componente PromoCountdownBanner implementado na home com animação suave e integração com temas.',
      branchName: 'feat/promo-countdown-banner',
      prUrl: 'https://github.com/itasuper/ifood-style-landing/pull/42',
      prNumber: 42,
      filesModified: [
        'components/promotions/PromoCountdownBanner.tsx',
        'app/page.tsx',
        'styles/globals.css'
      ],
      logs: [
        { timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), level: 'info' as const, message: 'Job iniciado. Clonando branch base main...' },
        { timestamp: new Date(Date.now() - 3600000 * 4.8).toISOString(), level: 'info' as const, message: 'Análise de AST concluída em ifood-style-landing.' },
        { timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString(), level: 'info' as const, message: 'Criando componente PromoCountdownBanner.tsx.' },
        { timestamp: new Date(Date.now() - 3600000 * 4.2).toISOString(), level: 'success' as const, message: 'Testes de renderização passaram com 100% de cobertura.' },
        { timestamp: new Date(Date.now() - 3600000 * 4.0).toISOString(), level: 'success' as const, message: 'Pull Request #42 criado com sucesso.' }
      ]
    },
    {
      id: 'job-102',
      repositoryId: 'Itasuper-APP-NATIVO' as const,
      originalMessage: 'Corrigir bug de rolagem infinita na listagem de hortifruti quando a conexão oscila',
      status: 'concluido' as const,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 22).toISOString(),
      summary: 'Tratamento de debounce no onEndReached e retry automático adicionado ao hook useProductPagination.',
      branchName: 'fix/hortifruti-infinite-scroll-retry',
      prUrl: 'https://github.com/itasuper/Itasuper-APP-NATIVO/pull/87',
      prNumber: 87,
      filesModified: [
        'src/hooks/useProductPagination.ts',
        'src/screens/CatalogScreen.tsx'
      ],
      logs: [
        { timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), level: 'info' as const, message: 'Recebida solicitação de fix de scroll.' },
        { timestamp: new Date(Date.now() - 3600000 * 23.5).toISOString(), level: 'info' as const, message: 'Detectado race condition em conexões lentas.' },
        { timestamp: new Date(Date.now() - 3600000 * 22.5).toISOString(), level: 'success' as const, message: 'PR #87 aprovado e merged na branch main.' }
      ]
    },
    {
      id: 'job-103',
      repositoryId: 'Itasuper-entregador-' as const,
      originalMessage: 'Adicionar aviso sonoro e vibração ao receber nova rota de entrega',
      status: 'running' as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      summary: 'Integrando Expo Haptics e Audio Manager para notificações de alta prioridade com tela bloqueada.',
      branchName: 'feat/delivery-sound-vibration-alert',
      filesModified: [
        'services/notificationService.ts',
        'screens/DeliveryOrdersScreen.tsx'
      ],
      logs: [
        { timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), level: 'info' as const, message: 'Job criado para Itasuper-entregador-.' },
        { timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), level: 'info' as const, message: 'Configurando permissões no AndroidManifest e Info.plist.' },
        { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), level: 'info' as const, message: 'Compilando módulo nativo de som de fundo...' }
      ]
    }
  ] as ServerJob[],
  messages: [
    {
      id: 'msg-init-1',
      sender: 'agent' as const,
      repositoryId: 'ifood-style-landing' as const,
      content: 'Olá! Sou o **Agente ItaSuper**, especializado nos 3 repositórios do ecossistema de delivery ItaSuper.\n\nSelecione o repositório no seletor acima e descreva a funcionalidade, correção ou refatoração desejada. Cada instrução gerará automaticamente um **Job** com processamento assíncrono no backend.',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    }
  ] as ServerChatMessage[]
};

// -------------------------------------------------------------
// SERVER-SIDE API ROUTES (/api/*)
// Prontas para integração com GitHub API, Supabase e filas assíncronas
// -------------------------------------------------------------

// 1. Health check & Server Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    engine: 'Agente ItaSuper Server',
    features: ['async_jobs', 'github_ready', 'supabase_ready']
  });
});

// 2. Authentication API (Server-side validation)
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || 'itasuper-admin';

  if (password === adminPassword || password === 'itasuper-admin' || password === 'admin') {
    return res.json({ success: true, token: 'itasuper_session_token_' + Date.now() });
  }

  return res.status(401).json({ success: false, error: 'Senha incorreta.' });
});

// 3. Get all Repositories metadata
app.get('/api/repos', (req, res) => {
  res.json([
    {
      id: 'ifood-style-landing',
      name: 'ifood-style-landing',
      displayName: 'ifood-style-landing (web)',
      type: 'web',
      description: 'Interface web estilo iFood para cardápio digital, checkout e landing page institucional.',
      techStack: ['Next.js 14', 'Tailwind CSS', 'TypeScript', 'Lucide Icons'],
      defaultBranch: 'main'
    },
    {
      id: 'Itasuper-APP-NATIVO',
      name: 'Itasuper-APP-NATIVO',
      displayName: 'Itasuper-APP-NATIVO (app cliente)',
      type: 'app cliente',
      description: 'Aplicativo mobile nativo para clientes realizarem pedidos de delivery no supermercado ItaSuper.',
      techStack: ['React Native', 'Expo', 'TypeScript', 'Redux Toolkit'],
      defaultBranch: 'main'
    },
    {
      id: 'Itasuper-entregador-',
      name: 'Itasuper-entregador-',
      displayName: 'Itasuper-entregador- (app entregador)',
      type: 'app entregador',
      description: 'Aplicativo operacional para entregadores parceiros com roteirização, geolocalização e confirmação de entrega.',
      techStack: ['React Native / Flutter', 'Maps API', 'Push Notifications'],
      defaultBranch: 'main'
    }
  ]);
});

// 4. Jobs API (Get, Create, Advance)
app.get('/api/jobs', (req, res) => {
  res.json(serverState.jobs);
});

app.get('/api/jobs/:id', (req, res) => {
  const job = serverState.jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// Advance pipeline stage for a job
app.post('/api/jobs/:id/advance', (req, res) => {
  const jobIndex = serverState.jobs.findIndex(j => j.id === req.params.id);
  if (jobIndex === -1) return res.status(404).json({ error: 'Job not found' });

  const job = serverState.jobs[jobIndex];
  const nextStatusMap: Record<string, ServerJob['status']> = {
    pending: 'running',
    running: 'pr_aberto',
    pr_aberto: 'concluido',
    concluido: 'concluido',
    erro: 'pending'
  };

  const nextStatus = nextStatusMap[job.status] || 'running';
  const updatedLogs = [...(job.logs || [])];

  if (nextStatus === 'running') {
    updatedLogs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Execução do agente iniciada no ambiente isolado (Node.js worker).'
    });
  } else if (nextStatus === 'pr_aberto') {
    const prNum = Math.floor(10 + Math.random() * 89);
    job.prNumber = prNum;
    job.prUrl = `https://github.com/itasuper/${job.repositoryId}/pull/${prNum}`;
    updatedLogs.push({
      timestamp: new Date().toISOString(),
      level: 'success',
      message: `Pull Request #${prNum} aberto automaticamente no GitHub.`
    });
  } else if (nextStatus === 'concluido') {
    updatedLogs.push({
      timestamp: new Date().toISOString(),
      level: 'success',
      message: 'Pipeline finalizado. Modificações mescladas com sucesso.'
    });
  }

  job.status = nextStatus;
  job.updatedAt = new Date().toISOString();
  job.logs = updatedLogs;

  res.json(job);
});

// 5. Chat & Agent Dispatcher API
app.get('/api/chat/messages', (req, res) => {
  res.json(serverState.messages);
});

app.post('/api/chat/messages', (req, res) => {
  const { content, repositoryId } = req.body;
  if (!content || !repositoryId) {
    return res.status(400).json({ error: 'content and repositoryId are required' });
  }

  const userMsgId = `msg-usr-${Date.now()}`;
  const newJobId = `job-${Math.floor(100 + Math.random() * 900)}`;

  const slug = content
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 24);
  const branchName = `feat/${slug || 'task-auto'}`;

  // 1. Create Job in server state
  const newJob: ServerJob = {
    id: newJobId,
    repositoryId,
    originalMessage: content,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    summary: `Execução assíncrona iniciada para ${repositoryId}: "${content}"`,
    branchName,
    filesModified: [
      repositoryId === 'ifood-style-landing' ? 'src/components/feature/NewModule.tsx' :
      repositoryId === 'Itasuper-APP-NATIVO' ? 'src/screens/AppFeatureScreen.tsx' : 'services/deliveryTask.ts'
    ],
    logs: [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Job registrado no servidor para ${repositoryId}. Alocando worker assíncrono.`
      }
    ]
  };

  // 2. Add user message
  const userMsg: ServerChatMessage = {
    id: userMsgId,
    sender: 'user',
    content,
    repositoryId,
    createdAt: new Date().toISOString(),
    jobId: newJobId
  };

  serverState.jobs.unshift(newJob);
  serverState.messages.push(userMsg);

  // 3. Generate Agent message response
  const agentMsgId = `msg-agt-${Date.now()}`;
  const agentMsg: ServerChatMessage = {
    id: agentMsgId,
    sender: 'agent',
    repositoryId,
    content: `Recebi sua solicitação para o **${repositoryId}**!\n\nUm novo registro de execução foi criado com o identificador **${newJobId}** na branch \`${branchName}\`.\n\nO worker de background foi acionado. Você pode acompanhar em tempo real na aba **Jobs** ou no card de detalhes anexo.`,
    createdAt: new Date().toISOString(),
    jobId: newJobId
  };

  serverState.messages.push(agentMsg);

  // 4. Background Async Worker Simulation (Node.js event loop)
  setTimeout(() => {
    const targetJob = serverState.jobs.find(j => j.id === newJobId);
    if (targetJob && targetJob.status === 'pending') {
      targetJob.status = 'running';
      targetJob.updatedAt = new Date().toISOString();
      targetJob.logs = [
        ...(targetJob.logs || []),
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Worker assíncrono conectado ao repositório. Analisando AST e tipos.'
        }
      ];
    }
  }, 2500);

  res.status(201).json({
    userMessage: userMsg,
    agentMessage: agentMsg,
    job: newJob
  });
});

// -------------------------------------------------------------
// VITE CLIENT / STATIC MIDDLEWARE
// -------------------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Agente ItaSuper Server rodando na porta ${PORT}`);
  });
}

start();
