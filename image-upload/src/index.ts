import Modal from "./modal.js";
import { DataStorage, Item, ItemInput } from "./storage.js";

const dataForm = document.getElementById('dataForm') as HTMLFormElement;
const imgName = (document.getElementById('name') as HTMLInputElement);
const category = (document.getElementById('category') as HTMLSelectElement);
const imageFile = document.getElementById('image') as HTMLInputElement;
const itemsContainer = document.getElementById('itemsContainer') as HTMLElement;
const checkboxCategories = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

class Displayer extends DataStorage {
    protected selectedCategory: string[] = ['anime', 'buildings/urbans', 'nature'];
    private abortCtrl : AbortController;
  
    constructor() {
        super();
        this.abortCtrl = new AbortController();
        this.clickAndSubmitListeners();
    }

    private clickAndSubmitListeners(): void {
        const { signal } = this.abortCtrl;
        
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            const imageId = target.closest(".image-data")?.getAttribute("image-id");

            if (target.classList.contains("edit-btn") && imageId) this.selectedItem(imageId);
            if (target.classList.contains("delete-btn") && imageId) this.deleteImage(imageId);
            if (target.closest("#delete-all")) this.deleteAllImage();

            checkboxCategories.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.selectedCategory = Array.from(checkboxCategories)
                        .filter(c => c.checked)
                        .map(c => c.value as Item['category']);
                    this.showAllData();
                }, { signal });
            });
        }, { signal });

        dataForm.addEventListener("submit", (event) => this.handleFormSubmit(event), { signal });
    }

    async processingImage(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve((event.target as FileReader).result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    private async handleFormSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const file = imageFile.files?.[0];
        
        if (!imgName.value.trim() || !category.value || !file) {
            new Modal("Masukkan data dengan lengkap");
            return;
        }

        try {
            const imageData = await this.processingImage(file);
            const newItem: ItemInput = {
                imgName: imgName.value,
                category: category.value as Item['category'],
                image: imageData
            };

            if (this.getSelectedId()) {
                this.changeSelectedData(this.getSelectedId()!, newItem);
            } else {
                this.addDataToStorages(newItem);
            }
            this.showAllData();
        } catch (error) {
            new Modal("Gagal memproses gambar");
        }
        
        dataForm.reset();
        this.setSelectedId(null);
    }

    showAllData(): void {
        const imageFragment = document.createDocumentFragment();
        const data = this.getAllData();

        data.forEach(dt => {
            const getComponents = this.createImageComponent(dt);
            imageFragment.appendChild(getComponents);
        });

        itemsContainer.innerHTML = '';
        itemsContainer.appendChild(imageFragment);
    }

    createImageComponent(item: Item): HTMLElement {
        const div = document.createElement("div") as HTMLDivElement;
        div.className = "image-data";
        div.setAttribute("image-id", item.id);

        const h3 = document.createElement("h3") as HTMLHeadingElement;
        h3.textContent = `${item.imgName}`;
        
        const imageWrap = document.createElement("div") as HTMLDivElement;
        imageWrap.className = "image-wrap";

        const images = document.createElement("img") as HTMLImageElement;
        images.src = item.image;
        imageWrap.appendChild(images);

        const p = document.createElement("p") as HTMLParagraphElement;
        p.className = "category"
        p.textContent = `Kategori : ${item.category}`;

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "edit-btn";
        editBtn.textContent = "Edit";

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";

        div.append(imageWrap, h3, p, editBtn, deleteBtn);
        return div;
    }

    private selectedItem(id: string): void {
        const getData = this.getAllData().find(data => data.id === id);
        
        if (!getData) return;
        
        imgName.value = getData.imgName;
        category.value = getData.category;
        this.setSelectedId(id);
    }

    deleteImage(id: string): void {
        const selectedItem = document.querySelector(`[image-id="${id}"]`);
        if (selectedItem) {
            selectedItem.remove();
            this.deleteFromStorages(id);
        }
    }

    deleteAllImage(): void {
        const data = this.getAllData();
        if (data.length > 0) {
            itemsContainer.replaceChildren();
            this.deleteAllFromStorages();
        } else {
            new Modal("Tambahkan minimal 1 gambar");
        }
    }

    cleanUpListeners(): void {
        this.abortCtrl.abort();
    }
}

let displayer: Displayer;

function setupServices(): void {
    displayer = new Displayer();
    displayer.showAllData();
}

function cleanUp(): void {
    displayer.cleanUpListeners();
}

function init(): void {
    setupServices();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", cleanUp);