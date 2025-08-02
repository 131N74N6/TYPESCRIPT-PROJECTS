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
                balance: resolve(root, 'html', 'balance.html'),
                main: resolve(root, 'html', 'signin.html'),
                signup: resolve(root, 'html', 'signup.html'),
            }
        }
    },
    server: { open: '/html/signin.html' }
})