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
      if (!tsxRegistered) {
        try {
          await import('tsx');
          tsxRegistered = true;
        } catch (e) {
          console.warn('tsx not available');
        }
      }

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

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

          const fileUrl = pathToFileURL(handlerPath).href;
          const handlerModule = await import(fileUrl + '?t=' + Date.now());
          const handler = handlerModule.default || handlerModule;

          if (typeof handler !== 'function') return next();

          let body = {};
          if (req.method === 'POST' || req.method === 'PUT') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) chunks.push(chunk);
            const bodyString = Buffer.concat(chunks).toString();
            if (bodyString) {
              try {
                body = JSON.parse(bodyString);
              } catch {}
            }
          }

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

    plugins: [react(), vitePluginApi()],

    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(env.FIREBASE_STORAGE_BUCKET),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID),
      'process.env.FIREBASE_APP_ID': JSON.stringify(env.FIREBASE_APP_ID),
      'process.env.FIREBASE_MEASUREMENT_ID': JSON.stringify(env.FIREBASE_MEASUREMENT_ID),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname),      // Import file trong thư mục gốc
        '~': path.resolve(__dirname),      // Alias phụ
        'types': path.resolve(__dirname, 'types'), // Để import trực tiếp "types/enums"
      },
      extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
    },
  };
});
