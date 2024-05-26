import { join } from 'path';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig(({ mode }) => {
  const envDir = join('..', '..');
  const env = loadEnv(mode, envDir, ['PROXY', 'VITE', 'WEB_PORT']);

  const PORT = parseInt(env.WEB_PORT, 10);

  return {
    plugins: [react()],
    envDir,
    server: {
      port: PORT,
      proxy: {
        '/api': {
          target: env.PROXY_API,
          changeOrigin: true,
          rewrite: path => {
            if (path.toLowerCase() === '/api/healthz') {
              return '/healthz';
            }

            return path;
          },
        },
      },
    },
  };
});
