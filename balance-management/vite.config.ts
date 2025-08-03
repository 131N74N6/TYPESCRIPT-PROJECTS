import { resolve } from 'path';
import { defineConfig } from 'vite';
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
                main: resolve(root, 'html', 'signin.html'),
                balance: resolve(root, 'html', 'balance.html'),
                home: resolve(root, 'html', 'home.html'),
                signup: resolve(root, 'html', 'signup.html')
            }
        }
    },
    server: { open: '/html/signin.html' }
})