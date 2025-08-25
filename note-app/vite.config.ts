import { resolve } from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist');

export default defineConfig ({
    root,
    plugins: [tailwindcss()],
    build: {
        outDir,
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(root, 'html', 'index.html'),
                sign_up: resolve(root, 'html', 'signup.html'),
                home: resolve(root, 'html', 'home.html'),
                detail_note: resolve(root, 'html', 'detail-note.html'),
                add_note: resolve(root, 'html', 'add-note.html')
            }
        }
    },
    server: { open: 'html/index.html' }
})