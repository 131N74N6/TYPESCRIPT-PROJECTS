import Modal from "./modal.js";
import { DataStorage, Item, ItemInput } from "./storage.js";
import Theme from "./theme.js";

const dataForm = document.getElementById('dataForm') as HTMLFormElement;
const addDataBtn = document.getElementById('add-data') as HTMLButtonElement;
const imgName = document.getElementById('name') as HTMLInputElement;
const category = document.getElementById('category') as HTMLSelectElement;
const imageFile = document.getElementById('image') as HTMLInputElement;
const imagePreview = document.getElementById('image-preview') as HTMLImageElement;
const itemsContainer = document.getElementById('itemsContainer') as HTMLElement;
const checkboxCategories = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
const toggleTheme = document.getElementById('dark-mode') as HTMLInputElement;

class Displayer extends DataStorage {
    protected selectedCategory: string[] = ['anime', 'buildings/urbans', 'nature', 'cartoon'];
    getInstanceFromTheme = new Theme("dark-theme", "dark-theme");
    private abortCtrl : AbortController;

    constructor() {
        super("images-data");
        this.abortCtrl = new AbortController();
        this.eventListenersSetup();
    }

    private eventListenersSetup(): void {
        const { signal } = this.abortCtrl;
        
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            const imageId = target.closest(".image-data")?.getAttribute("image-id");

            if (target.classList.contains("edit-btn") && imageId) this.selectedItem(imageId);
            if (target.classList.contains("delete-btn") && imageId) this.deleteImage(imageId);
            if (target.closest("#delete-all")) this.deleteAllImage();
            if (target.closest("#add-data")) this.openForm();
            if (target.closest("#close-form")) this.closeForm();
        }, { signal });
        
        imagePreview.addEventListener("click", () => imageFile.click(), { signal })
        dataForm.addEventListener("submit", (event) => this.handleFormSubmit(event), { signal });
        imageFile.addEventListener("change", (event) => this.processingImage(event), { signal });
        toggleTheme.addEventListener("change", (event) => this.handleThemeToggle(event), { signal });
        
        checkboxCategories.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.selectedCategory = Array.from(checkboxCategories)
                    .filter(c => c.checked)
                    .map(c => c.value as Item['category']);
                this.showAllData();
            }, { signal });
        });
    }

    private processingImage(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        
        if (file) {
            const reader = new FileReader();
            reader.onloadend = (event) => {
                imagePreview.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    private handleFormSubmit(event: SubmitEvent): void {
        event.preventDefault();
        const isInEditMode: boolean = !!this.getSelectedId();
        const imgType = ["image/jpg","image/jpeg","image/png"];
        const getFile = (imageFile.files as FileList)?.[0];
        
        if (!imgName.value.trim() || !category.value) {
            new Modal("Masukkan data dengan lengkap");
            return;
        }  

        if (getFile && !imgType.includes(getFile.type)) {
            new Modal("File harus berupa gambar (JPG, JPEG, PNG)");
            return;
        }
    
        const newItem: ItemInput = {
            imgName: imgName.value,
            category: category.value as Item['category'],
            image: imagePreview.src
        }
    
        if (isInEditMode) {
            this.changeSelectedData(this.getSelectedId() as string, newItem);
        } else {
            this.addDataToStorages(newItem);
        }

        this.showAllData();
        this.resetForm();
    }

    private resetForm(): void {
        dataForm.reset();
        dataForm.style.display = "none";
        addDataBtn.style.display = "block";
        imageFile.value = '';
        imagePreview.src = './image/default-profile-picture.jpg';
        this.setSelectedId(null);
    }

    showAllData(): void {
        const imageFragment = document.createDocumentFragment();
        const data = this.getAllData().filter(dt => 
            this.selectedCategory.includes(dt.category)
        );

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
        images.alt = item.imgName;
        imageWrap.appendChild(images);

        const p = document.createElement("p") as HTMLParagraphElement;
        p.className = "category"
        p.textContent = `Kategori : ${item.category}`;

        const buttonWrap = document.createElement("div") as HTMLDivElement;
        buttonWrap.className = "button-wrap";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "edit-btn";
        editBtn.textContent = "Edit";

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";

        buttonWrap.append(editBtn, deleteBtn);

        div.append(imageWrap, h3, p, buttonWrap);
        return div;
    }

    private selectedItem(id: string): void {
        dataForm.style.display = "grid";
        const getData = this.getAllData().find(data => data.id === id);
        
        if (!getData) return;
        
        imgName.value = getData.imgName;
        category.value = getData.category;
        imagePreview.src = getData.image;
        imagePreview.style.display = 'block';
        imagePreview.alt = getData.imgName;
        this.setSelectedId(id)
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

    openForm(): void {
        dataForm.style.display = "grid";
        addDataBtn.style.display = "none";
    }

    closeForm(): void {
        dataForm.style.display = "none";
        addDataBtn.style.display = "block";
        dataForm.reset();
        imageFile.value = '';
        imagePreview.src = './image/default-profile-picture.jpg';
        this.setSelectedId(null);
    }

    cleanUpListeners(): void {
        this.abortCtrl.abort();
    }
    
    private handleThemeChange = this.getInstanceFromTheme.debounce((isChecked: boolean) => {
        this.getInstanceFromTheme.changeTheme(isChecked ? 'active' : 'inactive')
        this.getInstanceFromTheme.changeSign(isChecked ? 'Daylight Mode' : 'Midnight Mode');
    }, 100);

    private handleThemeToggle(event: Event) {
        this.handleThemeChange((event.target as HTMLInputElement).checked);
    }
}

let displayer: Displayer;

function init(): void {
    displayer = new Displayer();
    displayer.showAllData();
    toggleTheme.checked = displayer.getInstanceFromTheme.isActive;
}

function cleanUp(): void {
    displayer.cleanUpListeners();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", cleanUp);