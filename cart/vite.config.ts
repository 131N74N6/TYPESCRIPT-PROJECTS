import { resolve } from 'path';
import { defineConfig } from 'vite';

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist');

export default defineConfig ({
    root,
    build: {
        outDir,
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(root, 'html', 'index.html'),
                cart: resolve(root, 'html', 'cart.html'),
                add_product: resolve(root, 'html', 'add-product.html'),
                seller: resolve(root, 'html', 'seller.html'),
                customer: resolve(root, 'html', 'customer.html')
            }
        }
    },
    server: { open: 'html/index.html' }
});