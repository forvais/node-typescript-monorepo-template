import { join } from 'path';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig(({ mode }) => {
  const envDir = join('..', '..');
  const env = loadEnv(mode, envDir, ['PROXY', 'VITE']);

  return {
    plugins: [react()],
    envDir,
    server: {
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
