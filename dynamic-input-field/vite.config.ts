import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: path.resolve(__dirname, 'src'),
    build: {
        outDir: path.resolve(__dirname, 'dist'),
        rollupOptions: {
            input: { 
                main: path.resolve(__dirname, 'src/index.html'),
                handler: path.resolve(__dirname, 'src/handler.html')
            }
        }
    },
    server: {
        fs: { allow: [path.resolve(__dirname, 'src')] }
    }
});