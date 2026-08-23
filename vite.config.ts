import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import authHandler from './api/auth';
import reposHandler from './api/repos';
import jobsHandler from './api/jobs';
import jobIdHandler from './api/jobs/[id]';
import chatHandler from './api/chat';
import chatMessagesHandler from './api/chat/messages';

function vercelApiDevPlugin(): Plugin {
  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api')) {
          return next();
        }

        try {
          const parsedUrl = new URL(url, 'http://localhost:3000');
          const pathname = parsedUrl.pathname;
          
          // Helper to parse query parameters
          const queryParams: Record<string, string> = {};
          parsedUrl.searchParams.forEach((val, key) => {
            queryParams[key] = val;
          });

          // Helper to parse body if POST/PATCH/PUT
          let body: any = {};
          if (['POST', 'PATCH', 'PUT'].includes(req.method || '')) {
            body = await new Promise((resolve) => {
              let data = '';
              req.on('data', chunk => { data += chunk; });
              req.on('end', () => {
                try {
                  resolve(data ? JSON.parse(data) : {});
                } catch {
                  resolve({});
                }
              });
            });
          }

          // Mock VercelRequest and VercelResponse helpers
          const vercelReq = Object.assign(req, {
            query: queryParams,
            body
          }) as any;

          const vercelRes = Object.assign(res, {
            status(code: number) {
              res.statusCode = code;
              return vercelRes;
            },
            json(data: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return vercelRes;
            }
          }) as any;

          // Route dispatching matching Vercel Serverless Function file routes
          if (pathname === '/api/auth' || pathname === '/api/auth/login') {
            return await authHandler(vercelReq, vercelRes);
          }
          if (pathname === '/api/repos') {
            return await reposHandler(vercelReq, vercelRes);
          }
          if (pathname === '/api/jobs') {
            return await jobsHandler(vercelReq, vercelRes);
          }
          if (pathname.startsWith('/api/jobs/')) {
            const id = pathname.replace('/api/jobs/', '').split('/')[0];
            vercelReq.query.id = id;
            return await jobIdHandler(vercelReq, vercelRes);
          }
          if (pathname === '/api/chat/messages') {
            return await chatMessagesHandler(vercelReq, vercelRes);
          }
          if (pathname === '/api/chat') {
            return await chatHandler(vercelReq, vercelRes);
          }

          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `Route ${pathname} not found` }));
        } catch (error: any) {
          console.error('[API Dev Error]', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      vercelApiDevPlugin()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
