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
                main: resolve(root, 'html', 'signin.html'),
                sign_up: resolve(root, 'html', 'signup.html'),
                home: resolve(root, 'html', 'home.html')
            }
        }
    },
    server: { open: '/html/signin.html' }
})