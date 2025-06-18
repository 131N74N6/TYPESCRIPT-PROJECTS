import Storage from './supabase-table';
import type { CartItem, Product } from './types';

const dataStorage = Storage<Product>('products');
const cartStorage = Storage<CartItem>('product_cart');
const controller = new AbortController();
const productList = document.getElementById('product-list') as HTMLElement;

async function initEventListeners(): Promise<void> {
    await dataStorage.realtimeInit((data) => showAllProducts(data));
}

function showAllProducts(goods: Product[]): void {
    const fragment = document.createDocumentFragment();
    try {
        if (goods.length > 0) {
            goods.forEach((good) => {
                const productComponent = createProductComponent(good);
                fragment.appendChild(productComponent);
            });
            productList.innerHTML = '';
            productList.appendChild(fragment);
        } else {
            productList.innerHTML = `<div class='error-message'>No products available.</div>`;
        }
    } catch (error) {
        productList.innerHTML = `<div class='error-message'>Unknown Error Occurred.</div>`;
    }
}

function createProductComponent(goods: Product): HTMLDivElement {
    const productElement = document.createElement('div') as HTMLDivElement;
    productElement.className = 'product-card';
    productElement.dataset.id = goods.id;

    const goodsName = document.createElement('h2') as HTMLHeadingElement;
    goodsName.textContent = goods.name;
    goodsName.className = 'product-name';

    const goodsPrice = document.createElement('p') as HTMLParagraphElement;
    goodsPrice.textContent = `Price: IDR ${goods.price}`;
    goodsPrice.className = 'product-price';

    const goodsImage = document.createElement('img') as HTMLImageElement;
    goodsImage.src = goods.image_url;
    goodsImage.alt = goods.name;
    goodsImage.className = 'product-image';

    const imageWrapper = document.createElement('div') as HTMLDivElement;
    imageWrapper.className = 'product-image-wrapper';
    imageWrapper.appendChild(goodsImage);

    const addToCart = document.createElement('button') as HTMLButtonElement;
    addToCart.className = 'add-to-cart-button';
    addToCart.type = 'button';
    addToCart.innerHTML = `<i class='fa-solid fa-cart-plus'></i>`;
    addToCart.onclick = async () => await cartStorage.insertData(goods);

    const buttonWrap = document.createElement('div') as HTMLDivElement;
    buttonWrap.className = 'button-wrap';
    buttonWrap.append(addToCart);

    productElement.append(imageWrapper, goodsName, goodsPrice, buttonWrap);
    return productElement;
}

function teardown(): void {
    controller.abort();
    cartStorage.teardownStorage();
}

document.addEventListener('DOMContentLoaded', initEventListeners)
window.addEventListener('beforeunload', teardown);