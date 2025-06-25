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
    productElement.className = 'bg-[#7B4B94] p-[1rem] rounded-[1rem] gap-[0.7rem] flex items-start text-[1rem] shadow-[0_4px_#C4FFB2] text-[#B7E3CC] font-mono';
    productElement.id = `product-data-${chosenProduct.id}`;

    const goodsName = document.createElement('div') as HTMLDivElement;
    goodsName.textContent = `Name: ${chosenProduct.name}`;
    goodsName.className = 'product-name';

    const goodsPrice = document.createElement('div') as HTMLDivElement;
    goodsPrice.textContent = `Price: IDR ${chosenProduct.price}`;
    goodsPrice.className = 'product-price';

    const goodsImage = document.createElement('img') as HTMLImageElement;
    goodsImage.src = chosenProduct.image_url;
    goodsImage.alt = chosenProduct.name;
    goodsImage.className = 'w-[100%] h-[100%] object-cover rounded-[0.5rem]';

    const imageWrapper = document.createElement('div') as HTMLDivElement;
    imageWrapper.className = 'w-[120px] h-[120px]';
    imageWrapper.appendChild(goodsImage);

    if (getSelectedId !== chosenProduct.id) {
        const goodsQuantity = document.createElement('div') as HTMLDivElement;
        goodsQuantity.textContent = `Quantity: ${chosenProduct.quantity}`;

        const removeButton = document.createElement('button') as HTMLButtonElement;
        removeButton.className = 'shadow-[3px_3px_#7D82B8] bg-[#D6F7A3] border-[none] font-[550] w-[80px] rounded-[0.4rem] cursor-pointer text-[#7B4B94] text-[0.9rem] p-[0.4rem] font-mono font-[500]';
        removeButton.textContent = 'Remove';
        removeButton.type = 'button';
        removeButton.onclick = async () => await cartStorage.deleteData(chosenProduct.id);

        const changeQuantity = document.createElement('button') as HTMLButtonElement;
        changeQuantity.type = 'button';
        changeQuantity.className = 'shadow-[3px_3px_#7D82B8] bg-[#D6F7A3] border-[none] font-[550] w-[80px] rounded-[0.4rem] cursor-pointer text-[#7B4B94] text-[0.9rem] p-[0.4rem] font-mono font-[500]';
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
        buttonWrap.className = 'flex gap-[0.7rem]';
        buttonWrap.append(changeQuantity, removeButton);

        const metaData = document.createElement('div') as HTMLDivElement;
        metaData.className = 'flex flex-col gap-[0.4rem]';
        metaData.append(goodsName, goodsPrice, goodsQuantity, buttonWrap);

        productElement.append(imageWrapper, metaData);
    } else {
        const newQuantity = document.createElement('input') as HTMLInputElement;
        newQuantity.className = 'bg-[#D6F7A3] shadow-[3px_3px_#7D82B8] font-[500] outline-0 text-[#7B4B94] text-[0.9rem] p-[0.4rem] rounded-[0.4rem]';
        newQuantity.placeholder = 'Quantity';
        newQuantity.name = `new-quantity-for-${chosenProduct.name}`;
        newQuantity.value = chosenProduct.quantity.toString();

        const cancelButton = document.createElement('button') as HTMLButtonElement;
        cancelButton.type = 'button';
        cancelButton.className = 'shadow-[3px_3px_#7D82B8] bg-[#D6F7A3] border-[none] font-[550] w-[80px] rounded-[0.4rem] cursor-pointer text-[#7B4B94] text-[0.9rem] p-[0.4rem] font-mono font-[500]';
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = () => {
            getSelectedId = null;
            changeExistingComponent(chosenProduct.id);
        }

        const saveChange = document.createElement('button') as HTMLButtonElement;
        saveChange.className = 'shadow-[3px_3px_#7D82B8] bg-[#D6F7A3] border-[none] font-[550] w-[80px] rounded-[0.4rem] cursor-pointer text-[#7B4B94] text-[0.9rem] p-[0.4rem] font-mono font-[500]';
        saveChange.type = 'button';
        saveChange.textContent = 'Save';
        saveChange.onclick = async () => {
            const trimmedQuantity = Number(newQuantity.value.trim());

            if (isNaN(trimmedQuantity)) {
                cartNotification.createNotification('Invalid quantity!');
                cartNotification.showNotivication();
                return;
            }

            try {
                if (trimmedQuantity <= 0) {
                    await cartStorage.deleteData(chosenProduct.id);
                } else {
                    const unitPrice = chosenProduct.price / chosenProduct.quantity;
            
                    // 2. Hitung harga baru berdasarkan kuantitas baru
                    const newPrice = unitPrice * trimmedQuantity;

                    await cartStorage.changeSelectedData(chosenProduct.id, {
                        price: newPrice, // Gunakan harga baru yang dihitung
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
        buttonWrap.className = 'flex flex-wrap gap-[0.6rem]';
        buttonWrap.append(saveChange, cancelButton);

        const newMetaData = document.createElement('div') as HTMLDivElement;
        newMetaData.className = 'flex flex-col gap-[0.4rem]';
        newMetaData.append(goodsName, goodsPrice, newQuantity, buttonWrap);

        productElement.append(imageWrapper, newMetaData);
    }
    return productElement;
}

async function removeProducts(): Promise<void> {
    try {
        if (cartStorage.toArray().length > 0) {
            await cartStorage.deleteData();
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
    cartStorage.teardownStorage();
}

function changeExistingComponent(chosenProductId: string): void {
    const component = chosenProductsList.querySelector(`#product-data-${chosenProductId}`);
    if (component) {
        const getData = cartStorage.currentData.get(chosenProductId);
        if (getData) {
            const newComponent = createProductComponent(getData);
            newComponent.id = `product-data-${chosenProductId}`;
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