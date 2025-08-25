import { resolve } from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const root = resolve(__dirname);
const outDir = resolve(__dirname, 'dist');

export default defineConfig ({
    root,
    plugins: [tailwindcss()],
    build: {
        outDir,
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(root, 'index.html'),
                signup: resolve(root, 'src/html', 'signup.html'),
                home: resolve(root, 'src/html', 'home.html'),
                detail_note: resolve(root, 'src/html', 'detail-note.html'),
                add_note: resolve(root, 'src/html', 'add-note.html')
            }
        }
    },
    server: { open: 'index.html' }
})