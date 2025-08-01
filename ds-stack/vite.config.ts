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
                activites: resolve(root, 'html', 'activities.html'),
                hobbies: resolve(root, 'html', 'hobbies.html'),
                hobbies_form: resolve(root, 'html', 'hobbies-form.html')
            }
        }
    },
    server: { open: '/html/index.html' }
});