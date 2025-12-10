import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { stat } from 'fs/promises';
import { join } from 'path';
import { pathToFileURL } from 'url';

// Plugin đơn giản để xử lý API routes
function vitePluginApi(): Plugin {
  let tsxRegistered = false;
  
  return {
    name: 'vite-plugin-api',
    async configureServer(server) {
      // Register tsx để load TypeScript
      if (!tsxRegistered) {
        try {
          await import('tsx');
          tsxRegistered = true;
        } catch (e) {
          console.warn('tsx not available');
        }
      }

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        try {
          const urlPath = req.url.split('?')[0];
          const apiPath = urlPath.replace('/api/', '');
          const filePath = join(process.cwd(), 'api', `${apiPath}.ts`);

          let handlerPath: string | null = null;
          try {
            await stat(filePath);
            handlerPath = filePath;
          } catch {
            return next();
          }

          // Load và chạy handler
          const fileUrl = pathToFileURL(handlerPath).href;
          const handlerModule = await import(fileUrl + '?t=' + Date.now());
          const handler = handlerModule?.default || handlerModule;

          if (typeof handler !== 'function') {
            return next();
          }

          // Parse body
          let body = {};
          if (req.method === 'POST' || req.method === 'PUT') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const bodyString = Buffer.concat(chunks).toString();
            if (bodyString) {
              try {
                body = JSON.parse(bodyString);
              } catch {}
            }
          }

          // Tạo request/response objects
          const expressReq = {
            ...req,
            method: req.method || 'GET',
            body,
            headers: req.headers,
          } as any;

          const expressRes = {
            ...res,
            status: (code: number) => ({
              json: (data: any) => {
                res.statusCode = code;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              },
            }),
            json: (data: any) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
          } as any;

          await handler(expressReq, expressRes);
        } catch (error: any) {
          console.error('API error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3009,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        vitePluginApi(), // Plugin để xử lý API routes
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
