import type { Product } from "./custom-types";
import Storage from "./supabase-table";
import Modal from "./notification";
import { InsertFile } from "./supabase-storage";
import { getSession } from "./supabase-config";

let currentImageFile: File | null = null;
let currentUserId: string | null = null;
const tableStorage = Storage<Product>("products");
const controller = new AbortController();

const notification = document.getElementById('add-product-notification') as HTMLElement;
const addProductFields = document.getElementById('add-product') as HTMLFormElement;
const insertNotification = Modal(notification);
const resetInserted = document.querySelector('#reset-inserted') as HTMLButtonElement;

const productName = document.getElementById('product-name') as HTMLInputElement;
const productPrice = document.getElementById('product-price') as HTMLInputElement;
const productImage = document.querySelector('#product-image') as HTMLInputElement;
const productImagePreview = document.querySelector('#product-image-preview') as HTMLDivElement;

async function initEventListeners(): Promise<void> {
    productImagePreview.onclick = () => productImage.click();
    resetInserted.onclick = () => resetForm();

    const session = await getSession();
    if (session && session.user) {
        currentUserId = session.user.id;
    } else {
        insertNotification.createNotification('Please sign in to add new product');
        insertNotification.showNotivication();
        return;
    }

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
            makeProductImage.className = 'w-[100%] h-[100%] rounded-[1rem] object-cover';
            makeProductImage.alt = file.name;
            productImagePreview.innerHTML = '';
            productImagePreview.appendChild(makeProductImage);
        }
        reader.onerror = () => {
            insertNotification.createNotification('Failed to read the file.');
            insertNotification.showNotivication();
            productImagePreview.innerHTML = `<div class="text-[#D6F7A3] text-[1rem] font-[500] p-[1rem]">No Image Selected</div>`;
        }
        reader.readAsDataURL(file);
    }
}

async function addProduct(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const trimmedProductName = productName.value.trim();
    const trimmedProductPrice = Number(productPrice.value.trim());

    if (trimmedProductName === '' || isNaN(trimmedProductPrice) || !productImage) {
        insertNotification.createNotification('Missing required data');
        insertNotification.showNotivication();
        return;
    }

    if (!currentImageFile) return;
    if (!currentUserId) return;

    try {
        await tableStorage.insertData({
            name: trimmedProductName,
            price: trimmedProductPrice,
            image_name: currentImageFile.name,
            image_url: await InsertFile('product', currentImageFile),
            user_id: currentUserId
        });
    } catch (error: any) {
        insertNotification.createNotification(`Error: ${error.message || error}`);
        insertNotification.showNotivication();
    }
}

function resetForm(): void {
    addProductFields.reset();
    productImage.value = '';
}

function teardownForm(): void {
    resetForm();
    currentImageFile = null;
    controller.abort();
    productImagePreview.innerHTML = `<div class="text-[#D6F7A3] text-[1rem] font-[500] p-[1rem]">No Image Selected</div>`;
    insertNotification.teardownNotivication();
}

document.addEventListener('DOMContentLoaded', initEventListeners);
window.addEventListener('beforeunload', teardownForm);