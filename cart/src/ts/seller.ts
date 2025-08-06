import Storage from './supabase-table';
import type { Product } from './custom-types';
import Modal from './notification';
import { InsertFile, RemoveFile } from './supabase-storage';
import { getSession, supabase } from './supabase-config';

const dataStorage = Storage<Product>('products');
const controller = new AbortController();
const storageName = 'product';

const username = document.getElementById('username') as HTMLDivElement;
const productList = document.getElementById('product-list') as HTMLElement;
const notification = document.getElementById('seller-notification') as HTMLElement;
const sellerNotification = Modal(notification);

let currentUserId: string | null = null;
let getSelectedId: string | null = null;
let newImageFile: File | null = null;
let newImageUrl: string;
let newImageName: string;

async function initEventListeners(): Promise<void> {
    const session = await getSession();
    if (session && session.user) {
        currentUserId = session.user.id;
        if (currentUserId) await showUserName(currentUserId);
    } else {
        sellerNotification.createNotification('Please sign in to see to gain access');
        sellerNotification.showNotivication();
        return;
    }

    await dataStorage.realtimeInit({
        callback: (data) => showAllProducts(data),
        additionalQuery: (addQuery) => addQuery.eq('user_id', currentUserId)
    });

    document.addEventListener('click', async(event) => {
        const target = event.target as HTMLElement;
        if (target.closest('#delete-all-product')) await deleteAllProduct();
    }, { signal: controller.signal });
}

async function showUserName(userId: string) {
    try {
        const { data, error } = await supabase
        .from('cart_user')
        .select('username')
        .eq('id', userId)
        .single()

        if (error) throw 'Failed to get and show username';

        if (data && data.username) {
            username.innerHTML = '';
            username.textContent = `Hello, ${data.username}`;
        } else {
            username.innerHTML = '';
            username.textContent = 'Hello, user';
        }
    } catch (error: any) {
        username.innerHTML = '';
        username.textContent = `Error: ${error.message}`;
    }
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
    productElement.id = `product-card-${goods.id}`;

    if (getSelectedId !== goods.id) {
        const goodsName = document.createElement('div') as HTMLDivElement;
        goodsName.textContent = `Name: ${goods.name}`;
        goodsName.className = 'product-name';

        const goodsPrice = document.createElement('div') as HTMLDivElement;
        goodsPrice.textContent = `Price: IDR ${goods.price}`;
        goodsPrice.className = 'product-price';

        const goodsImage = document.createElement('img') as HTMLImageElement;
        goodsImage.src = goods.image_url;
        goodsImage.alt = goods.name;
        goodsImage.className = 'product-image';

        const imageWrapper = document.createElement('div') as HTMLDivElement;
        imageWrapper.className = 'product-image-wrapper';
        imageWrapper.appendChild(goodsImage);

        const editButton = document.createElement('button') as HTMLButtonElement;
        editButton.className = 'edit-button';
        editButton.type = 'button';
        editButton.textContent = 'Edit';
        editButton.onclick = () => {
            const previousProductId = getSelectedId;
            getSelectedId = goods.id;
            changeExistingComponent(goods.id);

            if (previousProductId && previousProductId !== goods.id) {
                changeExistingComponent(previousProductId);
            }
        }

        const deleteButton = document.createElement('button') as HTMLButtonElement;
        deleteButton.className = 'delete-button';
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = async () => {
            try {
                if (dataStorage.toArray().length > 0) {
                    await dataStorage.deleteData(goods.id);
                    await RemoveFile(goods.image_url, storageName);
                } else {
                    productList.innerHTML = `<div class="error-message">No products available.</div>`;
                }
            } catch (error: any) {
                sellerNotification.createNotification(`Failed to delete product: ${error.message || error}`);
                sellerNotification.showNotivication();
            }
        }

        const buttonWrap = document.createElement('div') as HTMLDivElement;
        buttonWrap.className = 'button-wrap';
        buttonWrap.append(editButton, deleteButton);

        const metaData = document.createElement('div') as HTMLDivElement;
        metaData.className = 'product-metadata';
        metaData.append(goodsName, goodsPrice, buttonWrap);

        productElement.append(imageWrapper, metaData);
    } else {
        const newImageProduct = document.createElement('img') as HTMLImageElement;
        newImageProduct.src = goods.image_url;
        newImageProduct.alt = goods.image_name;

        const newImageWrap = document.createElement('div') as HTMLDivElement;
        newImageWrap.className = 'product-image-wrapper cursor-pointer';
        newImageWrap.onclick = () => newImageInput.click();
        newImageWrap.appendChild(newImageProduct);

        const newImageInput = document.createElement('input') as HTMLInputElement;
        newImageInput.type = 'file';
        newImageInput.className = 'hidden';
        newImageInput.id = 'new-product-image';
        newImageInput.accept = 'image/*';
        newImageInput.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0] || null;
            target.value = '';
            newImageFile = file;

            if (file) {
                if (!file.type.startsWith('image/')) {
                    sellerNotification.createNotification('Please select an image file (jpg, jpeg, png, gif, etc.)');
                    sellerNotification.showNotivication();
                    return;
                }

                const reader = new FileReader();
                reader.onloadend = (event) => {
                    const newUrl = event.target?.result as string;
                    newImageInput.value = '';
                    newImageProduct.src = newUrl;
                    newImageProduct.alt = file.name;
                }
                reader.onerror = () => {
                    sellerNotification.createNotification('Failed to read the file.');
                    sellerNotification.showNotivication();
                }
                reader.readAsDataURL(file);
            }
        }

        const newProductName = document.createElement('input') as HTMLInputElement;
        newProductName.type = 'text';
        newProductName.placeholder = 'Insert new name...';
        newProductName.id = 'new-product-name';
        newProductName.value = goods.name;

        const newProductPrice = document.createElement('input') as HTMLInputElement;
        newProductPrice.type = 'text';
        newProductPrice.value = goods.price.toString();
        newProductPrice.id = 'new-product-price';
        newProductPrice.placeholder = 'Insert new price...';

        const saveButton = document.createElement('button') as HTMLButtonElement;
        saveButton.className = 'save-button';
        saveButton.type = 'button';
        saveButton.textContent = 'Save';
        saveButton.onclick = async () => {
            const trimmedNewProductTitle = newProductName.value.trim();
            const trimmedNewProductPrice = Number(newProductPrice.value.trim());

            newImageUrl = goods.image_url;
            newImageName = goods.image_name;

            if (trimmedNewProductTitle === '' || isNaN(trimmedNewProductPrice)) {
                sellerNotification.createNotification('Missing required data');
                sellerNotification.showNotivication();
                return;
            }

            if (newImageFile) {
                try {
                    await RemoveFile(goods.image_url, storageName);
                    newImageUrl = await InsertFile(storageName, newImageFile);
                    newImageName = newImageFile.name;
                } catch (error: any) {
                    sellerNotification.createNotification(`Error: ${error.message || error}`);
                    sellerNotification.showNotivication();
                    return;
                }
            }

            try {
                await dataStorage.changeSelectedData(goods.id, {
                    name: trimmedNewProductTitle,
                    price: trimmedNewProductPrice,
                    image_name: newImageName,
                    image_url: newImageUrl
                });
                getSelectedId = null;
                changeExistingComponent(goods.id);
            } catch (error: any) {
                sellerNotification.createNotification(`Error: ${error.message || error}`);
                sellerNotification.showNotivication();
            }
        }

        const cancelButton = document.createElement('button') as HTMLButtonElement;
        cancelButton.textContent = 'Cancel';
        cancelButton.className = 'cancel-button';
        cancelButton.type = 'button';
        cancelButton.onclick = () => {
            getSelectedId = null;
            changeExistingComponent(goods.id);
            newImageInput.value = '';
            newImageFile = null;
            newImageName = '';
            newImageUrl = '';
        }

        const buttonWrap = document.createElement('div') as HTMLDivElement;
        buttonWrap.className = 'button-wrap';
        buttonWrap.append(saveButton, cancelButton);

        const metaData = document.createElement('div') as HTMLDivElement;
        metaData.className = 'product-metadata';
        metaData.append(newProductName, newProductPrice, buttonWrap);

        productElement.append(newImageInput, newImageWrap, metaData);
    }
    return productElement;
}

function changeExistingComponent(productId: string) {
    const productCard = productList.querySelector(`#product-card-${productId}`);
    if (productCard) {
        const productData = dataStorage.currentData.get(productId);
        if (productData) {
            const newComponent = createProductComponent(productData);
            newComponent.id = `product-card-${productId}`;
            productCard.replaceWith(newComponent);
        } else {
            productCard.remove();

            if (dataStorage.currentData.size === 0) {
                productList.innerHTML = `<div class="error-message">No products available.</div>`;
            }
        }
    } else {
        showAllProducts(dataStorage.toArray());
    }
}

async function deleteAllProduct(): Promise<void> {
    try {
        if (dataStorage.toArray().length > 0) {
            const imageUrls: string[] = dataStorage.toArray().map(data => data.image_url);
            await dataStorage.deleteData();
            await Promise.all(imageUrls.map(url => RemoveFile(url, storageName)));
        } else {
            productList.innerHTML = `<div class="error-message">No products available.</div>`;
        }
    } catch (error: any) {
        sellerNotification.createNotification(`Failed to delete product: ${error.message || error}`);
        sellerNotification.showNotivication();
    }
}

function teardown(): void {
    controller.abort();
    sellerNotification.teardownNotivication();
    dataStorage.teardownStorage();
    getSelectedId = null;
    newImageFile = null;
    newImageName = '';
    newImageUrl = '';
}

document.addEventListener('DOMContentLoaded', initEventListeners)
window.addEventListener('beforeunload', teardown);