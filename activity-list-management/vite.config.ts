import { defineConfig } from "vite";
import { resolve } from 'path';
import tailwindcss from "@tailwindcss/vite";

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
                add_note: resolve(root, 'html', 'add-note.html'),
                activity: resolve(root, 'html', 'activity.html'),
                note: resolve(root, 'html', 'note.html')
            }
        }
    },
    server: { open: 'html/index.html' }
});