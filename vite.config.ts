
import { fileURLToPath, URL } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // This is the required line for GitHub Pages.
      // It must match your repository name.
      base: '/My-Stories/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // FIX: The use of `process.cwd()` caused a TypeScript error.
          // Replaced with `import.meta.url` which is the standard way to get the current module's path in ES modules.
          '@': fileURLToPath(new URL('.', import.meta.url)),
        }
      }
    };
});
