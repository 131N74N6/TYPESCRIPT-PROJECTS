import Storage from "./storage";
import Theme from "./theme";
import Modal from "./modal";

const dataForm = document.getElementById('dataForm') as HTMLFormElement;
const addDataBtn = document.getElementById('add-data') as HTMLButtonElement;
const imageName = document.getElementById('title') as HTMLInputElement;
const category = document.getElementById('category') as HTMLSelectElement;
const urlInputWrapper = document.querySelector('.url-wrap') as HTMLInputElement;

const imagesLsit = document.getElementById('itemsContainer') as HTMLElement;
const checkboxCategories = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
const toggleTheme = document.getElementById('dark-mode') as HTMLInputElement;
const modal = document.getElementById("modal") as HTMLElement;

type ImageData = {
    id: string;
    title: string;
    url: string[];
    category: string;
}

const storage = Storage<ImageData>("images");
const theme = Theme("dark-theme", "dark-theme");
const notification = Modal(modal);
const controller = new AbortController();

const ImageDisplayer = () => ({
    currentData: [] as ImageData[],
    selectedCategory: ['anime', 'buildings/urbans', 'nature/views', 'cartoon'] as string[],

    initEventListeners(): void {
        storage.realtimeInit((image_data) => {
            this.currentData = image_data;
            this.showAllImages();
        });

        document.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#add-input-field")) this.addInputButton();
            else if (target.closest("#delete-all")) await this.deleteAllImages();
            else if (target.closest("#add-data")) this.openForm();
            else if (target.closest("#close-form")) this.closeForm();
        }, { signal: controller.signal });

        checkboxCategories.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.selectedCategory = Array.from(checkboxCategories)
                    .filter(c => c.checked)
                    .map(c => c.value as ImageData['category']);
                this.showAllImages();
            }, { signal: controller.signal });
        });

        dataForm.addEventListener("submit", async (event) => await this.saveImages(event), { 
            signal: controller.signal 
        });

        toggleTheme.addEventListener("change", (event) => this.handleThemeToggle(event), { 
            signal: controller.signal 
        });
    },

    handleThemeChange: theme.debounce((isChecked: boolean) => {
        theme.changeTheme(isChecked ? 'active' : 'inactive')
        theme.changeSign(isChecked ? 'Daylight Mode' : 'Midnight Mode');
    }, 100),

    handleThemeToggle(event: Event) {
        this.handleThemeChange((event.target as HTMLInputElement).checked);
    },

    createInputField(value?: string): HTMLInputElement {
        const urlInput = document.createElement("input") as HTMLInputElement;
        urlInput.className = "url-input";
        urlInput.type = "text";
        urlInput.placeholder = "enter url...";
        if (value) urlInput.value = value.trim();
        return urlInput
    },

    addInputButton(): void {
        urlInputWrapper.appendChild(this.createInputField());
    },

    async saveImages(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const getAllUrlInput = document.querySelectorAll<HTMLInputElement>('.url-wrap .url-input');
    
        if (!imageName.value.trim() || !category.value) {
            notification.createModalComponent("Masukkan data dengan lengkap");
            notification.showModal();
            return;
        }
    
        const newItem: Omit<ImageData, 'id'> = {
            title: imageName.value,
            category: category.value as ImageData['category'],
            url: Array.from(getAllUrlInput).map(data => data.value.trim()).filter(vl => vl)
        }
        
        await storage.saveToStorage(newItem);
        dataForm.reset();
    },

    showAllImages(): void {
        const imageFragment = document.createDocumentFragment();

        if (this.currentData.length > 0) {
            const filteredImages = this.currentData.filter(dt => 
                this.selectedCategory.includes(dt.category)
            );

            filteredImages.forEach(dt => {
                const getComponents = this.createImageComponent(dt);
                imageFragment.appendChild(getComponents);
            });
        } else {
            const empty = document.createElement("div") as HTMLDivElement;
            empty.className = "empty-msg";

            const message = document.createElement("div") as HTMLDivElement;
            message.className = "message";
            message.textContent = "Empty";

            empty.appendChild(message);
            imageFragment.appendChild(empty);
        }

        imagesLsit.innerHTML = '';
        imagesLsit.appendChild(imageFragment);
    },

    createImageComponent(data: ImageData): HTMLDivElement {
        const div = document.createElement("div") as HTMLDivElement;
        div.className = "image-data";

        const link = document.createElement("a") as HTMLAnchorElement;
        link.href = `detail.html?id=${data.id}`;
        
        const imageWrap = document.createElement("div") as HTMLDivElement;
        imageWrap.className = "image-wrap";

        data.url.forEach(url => {
            const images = document.createElement("img") as HTMLImageElement;
            images.src = url.trim();
            images.alt = data.title;
            imageWrap.appendChild(images);
        });

        link.appendChild(imageWrap);
        div.appendChild(link);
        return div;
    },

    openForm(): void {
        dataForm.style.display = "grid";
        addDataBtn.style.display = "none";
    },

    closeForm(): void {
        const getAllUrlInput = document.querySelectorAll<HTMLInputElement>('.url-wrap .url-input');
        dataForm.style.display = "none";
        addDataBtn.style.display = "block";
        Array.from(getAllUrlInput).forEach(input => input.remove());
        dataForm.reset();
    },

    async deleteAllImages(): Promise<void> {
        if (this.currentData.length > 0) {
            imagesLsit.replaceChildren();
            await storage.deleteAllData();
            dataForm.reset();
            this.currentData = [];
        } else {
            notification.createModalComponent("Tambahkan minimal 1 gambar");
            notification.showModal();
        }
        this.showAllImages();
    },

    teardown(): void {
        controller.abort();
    }
});

function initImageDisplayer(): void {
    ImageDisplayer().initEventListeners();
    toggleTheme.checked = theme.isActive;
}

function cleanupImageDisplayer(): void {
    ImageDisplayer().teardown();
    notification.teardownModal();
}

document.addEventListener("DOMContentLoaded", initImageDisplayer);
window.addEventListener("beforeunload", cleanupImageDisplayer);