import { RepositoryInfo, Job, ChatMessage } from '../types';

export const REPOSITORIES: RepositoryInfo[] = [
  {
    id: 'ifood-style-landing',
    name: 'ifood-style-landing',
    displayName: 'ifood-style-landing (web)',
    type: 'web',
    description: 'Interface web estilo iFood para cardápio digital, checkout e landing page institucional.',
    techStack: ['Next.js 14', 'Tailwind CSS', 'TypeScript', 'Lucide Icons'],
    defaultBranch: 'main',
    iconName: 'Globe',
    color: 'emerald'
  },
  {
    id: 'Itasuper-APP-NATIVO',
    name: 'Itasuper-APP-NATIVO',
    displayName: 'Itasuper-APP-NATIVO (app cliente)',
    type: 'app cliente',
    description: 'Aplicativo mobile nativo para clientes realizarem pedidos de delivery no supermercado ItaSuper.',
    techStack: ['React Native', 'Expo', 'TypeScript', 'Redux Toolkit'],
    defaultBranch: 'main',
    iconName: 'Smartphone',
    color: 'blue'
  },
  {
    id: 'Itasuper-entregador-',
    name: 'Itasuper-entregador-',
    displayName: 'Itasuper-entregador- (app entregador)',
    type: 'app entregador',
    description: 'Aplicativo operacional para entregadores parceiros com roteirização, geolocalização e confirmação de entrega.',
    techStack: ['React Native / Flutter', 'Maps API', 'Push Notifications'],
    defaultBranch: 'main',
    iconName: 'Bike',
    color: 'amber'
  }
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    sender: 'agent',
    repositoryId: 'ifood-style-landing',
    content: 'Olá! Sou o **Agente ItaSuper**, especializado nos 3 repositórios do ecossistema de delivery ItaSuper.\n\nSelecione o repositório no seletor acima e descreva a funcionalidade, correção ou refatoração desejada. Cada instrução gerará automaticamente um **Job** de execução no histórico.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  }
];

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job-101',
    repositoryId: 'ifood-style-landing',
    originalMessage: 'Adicionar banner promocional com contador regressivo no topo do cardápio web',
    status: 'pr_aberto',
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
      { timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), level: 'info', message: 'Job iniciado. Clonando branch base main...' },
      { timestamp: new Date(Date.now() - 3600000 * 4.8).toISOString(), level: 'info', message: 'Análise de AST concluída em ifood-style-landing.' },
      { timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString(), level: 'info', message: 'Criando componente PromoCountdownBanner.tsx.' },
      { timestamp: new Date(Date.now() - 3600000 * 4.2).toISOString(), level: 'success', message: 'Testes de renderização passaram com 100% de cobertura.' },
      { timestamp: new Date(Date.now() - 3600000 * 4.0).toISOString(), level: 'success', message: 'Pull Request #42 criado com sucesso.' }
    ]
  },
  {
    id: 'job-102',
    repositoryId: 'Itasuper-APP-NATIVO',
    originalMessage: 'Corrigir bug de rolagem infinita na listagem de hortifruti quando a conexão oscila',
    status: 'concluido',
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
      { timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), level: 'info', message: 'Recebida solicitação de fix de scroll.' },
      { timestamp: new Date(Date.now() - 3600000 * 23.5).toISOString(), level: 'info', message: 'Detectado race condition em conexões lentas.' },
      { timestamp: new Date(Date.now() - 3600000 * 22.5).toISOString(), level: 'success', message: 'PR #87 aprovado e merged na branch main.' }
    ]
  },
  {
    id: 'job-103',
    repositoryId: 'Itasuper-entregador-',
    originalMessage: 'Adicionar aviso sonoro e vibração ao receber nova rota de entrega',
    status: 'running',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    summary: 'Integrando Expo Haptics e Audio Manager para notificações de alta prioridade com tela bloqueada.',
    branchName: 'feat/delivery-sound-vibration-alert',
    filesModified: [
      'services/notificationService.ts',
      'screens/DeliveryOrdersScreen.tsx'
    ],
    logs: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), level: 'info', message: 'Job criado para Itasuper-entregador-.' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), level: 'info', message: 'Configurando permissões no AndroidManifest e Info.plist.' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), level: 'info', message: 'Compilando módulo nativo de som de fundo...' }
    ]
  }
];

export const PROMPT_SUGGESTIONS: Record<string, string[]> = {
  'ifood-style-landing': [
    'Adicionar filtro por categoria de produtos na landing page',
    'Otimizar imagens do cardápio com lazy loading no Next.js',
    'Criar modal de endereço com cálculo de taxa de entrega',
    'Adicionar suporte a cupom de desconto no resumo do carrinho'
  ],
  'Itasuper-APP-NATIVO': [
    'Adicionar tela de acompanhamento de pedido em tempo real com mapa',
    'Integrar pagamento via Pix com QR code copia e cola',
    'Melhorar o design do card de produto no aplicativo nativo',
    'Adicionar histórico de compras anteriores para recompra rápida'
  ],
  'Itasuper-entregador-': [
    'Calcular rota otimizada com múltiplas entregas no mesmo bairro',
    'Adicionar botão de contato direto via WhatsApp com o cliente',
    'Criar comprovante de entrega com foto obrigatória da embalagem',
    'Exibir resumo diário de ganhos e quilômetros rodados'
  ]
};
