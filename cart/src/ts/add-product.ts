import type { Product } from "./types";
import Storage from "./supabase-table";
import Modal from "./notification";
import { InsertFile } from "./supabase-storage";

let currentImageFile: File | null = null;
const tableStorage = Storage<Product>("products");
const controller = new AbortController();

const notification = document.getElementById('add-product-notification') as HTMLElement;
const addProductFields = document.getElementById('add-product') as HTMLFormElement;
const modal = Modal(notification);

const productName = document.getElementById('product-name') as HTMLInputElement;
const productPrice = document.getElementById('product-price') as HTMLInputElement;
const productImage = document.getElementById('product-image') as HTMLInputElement;
const productImagePreview = document.querySelector('.product-image-preview') as HTMLDivElement;

function initEventListeners(): void {
    addProductFields.addEventListener('submit', async (event) => await addProduct(event), { 
        signal: controller.signal 
    });

    productImage.addEventListener('change', (event) => changeImageToUrl(event), {
        signal: controller.signal
    });
}

function changeImageToUrl(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0] || null;
    currentImageFile = file;

    if (file) {
        const reader = new FileReader();
        reader.onloadend = (event) => {
            const urlData = event.target?.result as string;
            const makeProductImage = document.createElement("img") as HTMLImageElement;
            makeProductImage.src = urlData;
            makeProductImage.alt = file.name;
            productImagePreview.innerHTML = '';
            productImagePreview.appendChild(makeProductImage);
        }
        reader.readAsDataURL(file);
    }
}

async function addProduct(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const trimmedProductName = productName.value.trim();
    const trimmedProductPrice = Number(productPrice.value.trim());

    if (trimmedProductName === '' || isNaN(trimmedProductPrice) || !productImage) {
        throw new Error('Missing required data');
    }

    if (!currentImageFile) return;

    try {
        await tableStorage.insertData({
            created_at: new Date(),
            name: trimmedProductName,
            price: trimmedProductPrice,
            image_name: currentImageFile.name,
            image_url: await InsertFile('product', currentImageFile)
        });
    } catch (error: any) {
        modal.createNotification(`Error: ${error.message || error}`);
        modal.showNotivication();
    }
}

function teardownForm(): void {
    currentImageFile = null;
    controller.abort();
    modal.teardownNotivication();
}

document.addEventListener('DOMContentLoaded', initEventListeners);
window.addEventListener('beforeunload', teardownForm);