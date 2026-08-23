import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const repositories = [
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

  return res.status(200).json(repositories);
}
