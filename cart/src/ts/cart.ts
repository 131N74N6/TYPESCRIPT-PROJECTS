import TableStorage from './supabase-table';
import type { CartItem } from './types';
import Modal from './notification';

const cartStorage = TableStorage<CartItem>('product_cart');
const controller = new AbortController();
const chosenProductsList = document.getElementById('chosen-products-list') as HTMLElement;
const priceTotal = document.getElementById('price-total') as HTMLElement;

const notification = document.getElementById('cart-notification') as HTMLElement;
const cartNotification = Modal(notification);
let getSelectedId: string | null = null;

async function initEventListeners(): Promise<void> {
    await cartStorage.realtimeInit((data) => showAllChosenProduct(data));

    document.addEventListener('click', async (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('#remove-all-from-cart')) await removeProducts();
        else if (target.closest('#check-out')) await removeProducts();
    }, { signal: controller.signal });
}

function showAllChosenProduct(chosenProducts: CartItem[]): void {
    const fragment = document.createDocumentFragment();
    try {
        if (chosenProducts.length > 0) {
            chosenProducts.forEach(chosenProduct => fragment.appendChild(createProductComponent(chosenProduct)));
            chosenProductsList.innerHTML = '';
            chosenProductsList.appendChild(fragment);
            priceTotal.innerHTML = '';
            priceTotal.textContent = `IDR: ${cartStorage.toArray().reduce((prev, curr) => (prev + curr.price), 0)}`;
        } else {
            chosenProductsList.innerHTML = `<div class='error-message'>No products added.</div>`;
            priceTotal.innerHTML = '';
            priceTotal.textContent = `IDR: 0`;
        }
    } catch (error: any) {
        cartNotification.createNotification(`Error: ${error.message || error}`);
        cartNotification.showNotivication();
        chosenProductsList.innerHTML = `<div class='error-message'>Unknown error ocured.</div>`;
        priceTotal.innerHTML = '';
        priceTotal.textContent = `IDR: 0`;
    }
}

function createProductComponent(chosenProduct: CartItem): HTMLDivElement {
    const productElement = document.createElement('div') as HTMLDivElement;
    productElement.className = 'product-card';
    productElement.dataset.id = chosenProduct.id;

    const goodsName = document.createElement('div') as HTMLDivElement;
    goodsName.textContent = `Name: ${chosenProduct.name}`;
    goodsName.className = 'product-name';

    const goodsPrice = document.createElement('div') as HTMLDivElement;
    goodsPrice.textContent = `Price: IDR ${chosenProduct.price}`;
    goodsPrice.className = 'product-price';

    const goodsImage = document.createElement('img') as HTMLImageElement;
    goodsImage.src = chosenProduct.image_url;
    goodsImage.alt = chosenProduct.name;
    goodsImage.className = 'product-image';

    const imageWrapper = document.createElement('div') as HTMLDivElement;
    imageWrapper.className = 'product-image-wrapper';
    imageWrapper.appendChild(goodsImage);

    if (getSelectedId !== chosenProduct.id) {
        const goodsQuantity = document.createElement('div') as HTMLDivElement;
        goodsQuantity.id = 'new-quantity';
        goodsQuantity.textContent = `Quantity: ${chosenProduct.quantity}`;

        const removeButton = document.createElement('button') as HTMLButtonElement;
        removeButton.className = 'remove-button';
        removeButton.textContent = 'Remove';
        removeButton.type = 'button';
        removeButton.onclick = async () => await cartStorage.deleteSelectedData(chosenProduct.id);

        const changeQuantity = document.createElement('button') as HTMLButtonElement;
        changeQuantity.type = 'button';
        changeQuantity.className = 'change-button';
        changeQuantity.textContent = 'Change';
        changeQuantity.onclick = () => {
            const previousProductId = getSelectedId;
            getSelectedId = chosenProduct.id;
            changeExistingComponent(chosenProduct.id);

            if (previousProductId && previousProductId !== chosenProduct.id) {
                changeExistingComponent(previousProductId);
            }
        }

        const buttonWrap = document.createElement('div') as HTMLDivElement;
        buttonWrap.className = 'button-wrap';
        buttonWrap.append(changeQuantity, removeButton);

        const metaData = document.createElement('div') as HTMLDivElement;
        metaData.className = 'product-metadata';
        metaData.append(goodsName, goodsPrice, goodsQuantity, buttonWrap);

        productElement.append(imageWrapper, metaData);
    } else {
        const newQuantity = document.createElement('input') as HTMLInputElement;
        newQuantity.id = 'new-quantity';
        newQuantity.placeholder = 'Quantity';
        newQuantity.value = chosenProduct.quantity.toString();

        const cancelButton = document.createElement('button') as HTMLButtonElement;
        cancelButton.type = 'button';
        cancelButton.className = 'cancel-button';
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = () => {
            getSelectedId = null;
            changeExistingComponent(chosenProduct.id);
        }

        const saveChange = document.createElement('button') as HTMLButtonElement;
        saveChange.className = 'save-change';
        saveChange.type = 'button';
        saveChange.textContent = 'Save';
        saveChange.onclick = async () => {
            const trimmedQuantity = Number(newQuantity.value.trim());
            const newPrice = chosenProduct.price * trimmedQuantity;

            if (isNaN(trimmedQuantity)) {
                cartNotification.createNotification('Invalid quantity!');
                cartNotification.showNotivication();
                return;
            }

            try {
                if (trimmedQuantity <= 0) {
                    await cartStorage.deleteSelectedData(chosenProduct.id);
                } else {
                    await cartStorage.changeSelectedData(chosenProduct.id, {
                        price: newPrice,
                        quantity: trimmedQuantity
                    });
                }
                getSelectedId = null;
                changeExistingComponent(chosenProduct.id);
            } catch (error: any) {
                cartNotification.createNotification(`Error: ${error.message || error}`);
                cartNotification.showNotivication();
            }
        }

        const buttonWrap = document.createElement('div') as HTMLDivElement;
        buttonWrap.className = 'button-wrap';
        buttonWrap.append(saveChange, cancelButton);

        const newMetaData = document.createElement('div') as HTMLDivElement;
        newMetaData.className = 'product-metadata';
        newMetaData.append(imageWrapper, goodsName, goodsPrice, newQuantity, buttonWrap);

        productElement.append(newMetaData);
    }
    return productElement;
}

async function removeProducts(): Promise<void> {
    try {
        if (cartStorage.toArray().length > 0) {
            await cartStorage.deleteAllData();
        } else {
            chosenProductsList.innerHTML = `<div class='error-message'>No products added.</div>`;
        }
    } catch (error: any) {
        cartNotification.createNotification(`Error: ${error.message || error}`);
        cartNotification.showNotivication();
        chosenProductsList.innerHTML = `<div class='error-message'>No products added.</div>`;
    }
}

function teardownCart(): void {
    getSelectedId = null;
    priceTotal.innerHTML = '';
    priceTotal.textContent = 'IDR: 0';
    controller.abort();
    cartNotification.teardownNotivication();
}

function changeExistingComponent(chosenProductId: string): void {
    const component = chosenProductsList.querySelector(`product-card[data-id="${chosenProductId}"]`);
    if (component) {
        const getData = cartStorage.currentData.get(chosenProductId);
        if (getData) {
            const newComponent = createProductComponent(getData);
            newComponent.dataset.id = chosenProductId;
            component.replaceWith(newComponent);
        } else {
            component.remove();

            if (cartStorage.currentData.size === 0) {
                chosenProductsList.innerHTML = `<div class="error-message">No products selected.</div>`;
            }
        }
    } else {
        showAllChosenProduct(cartStorage.toArray());
    }
}

document.addEventListener('DOMContentLoaded', initEventListeners);
window.addEventListener('beforeunload', teardownCart);