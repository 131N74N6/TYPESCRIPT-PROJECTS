import { resolve } from "path";
import { defineConfig } from 'vite';
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
                add_post: resolve(root, 'html', 'add-post.html'),
                main: resolve(root, 'html', 'signin.html'),
                signup: resolve(root, 'html', 'signup.html'),
                setting: resolve(root, 'html', 'setting.html'),
                gallery: resolve(root, 'html', 'gallery.html'),
                detail: resolve(root, 'html', 'detail.html'),
                detail_user_only: resolve(root, 'html', 'detail-user-only.html')
            }
        }
    },
    server: {
        open: "/html/signin.html"
    }
})