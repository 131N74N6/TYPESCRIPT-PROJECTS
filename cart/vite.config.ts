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
                main: resolve(root, 'html', 'signin.html'),
                sign_up: resolve(root, 'html', 'signup.html'),
                cart: resolve(root, 'html', 'cart.html'),
                add_product: resolve(root, 'html', 'add-product.html'),
                seller: resolve(root, 'html', 'seller.html'),
                customer: resolve(root, 'html', 'customer.html')
            }
        }
    },
    server: { open: 'html/signin.html' }
})