import { resolve } from "path";
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
                gallery: resolve(root, 'html', 'gallery.html'),
                detail: resolve(root, 'html', 'detail.html')
            }
        }
    },
    server: {
        open: "/html/index.html"
    }
});