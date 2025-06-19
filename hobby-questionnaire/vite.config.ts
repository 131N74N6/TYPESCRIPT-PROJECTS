import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist');

export default defineConfig({
    root,
    plugins: [tailwindcss()],
    build: {
        outDir,
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(root, 'html', 'index.html'),
                anon: resolve(root, 'html', 'anon.html'),
                admin: resolve(root, 'html', 'admin.html')
            }
        }
    },
    server: { open: 'html/index.html' }
});