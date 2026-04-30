import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.join(__dirname, 'src/renderer'),
  publicDir: path.join(__dirname, 'public'),
  base: '',
  build: {
    outDir: path.join(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
});
