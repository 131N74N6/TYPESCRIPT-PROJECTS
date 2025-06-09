import { resolve } from 'path';
import { defineConfig } from 'vite';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist');

export default defineConfig({
    root,
    build: {
        outDir,
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(root, 'html', 'index.html'),
                dynamic_input: resolve(root, 'html', 'dynamic-input.html')
            }
        }
    },
    server: { open: '/html/index.html' }
});