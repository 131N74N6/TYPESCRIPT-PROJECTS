import DataManager from "./storage";
import Modal from "./modal";

interface Item {
    id: string;
    name: string;
    detail: string[];
}

class DisplayManager extends DataManager<Item> {
    private controller: AbortController = new AbortController();
    private inputSection: HTMLFormElement;
    private nameInput: HTMLInputElement;
    private dynamicFields: HTMLDivElement;
    private searchSection: HTMLFormElement;
    private searchData: HTMLInputElement;
    private itemsList: HTMLElement;
    private modalMessage: Modal;
    private selectedId: null | string = null;
    private errorNotification: HTMLElement;

    constructor(
        inputSection: HTMLFormElement, nameInput: HTMLInputElement, dynamicFields: HTMLDivElement, 
        searchSection: HTMLFormElement, searchData: HTMLInputElement, itemsList: HTMLElement, 
        modalMessage: HTMLElement, errorNotification: HTMLElement
    ) {
        super("dynamic input field");
        this.inputSection = inputSection;
        this.nameInput = nameInput;
        this.dynamicFields = dynamicFields;
        this.searchSection = searchSection;
        this.searchData = searchData;
        this.itemsList = itemsList
        this.modalMessage = new Modal(modalMessage);
        this.errorNotification = errorNotification;
        this.setEventListeners();
    }

    private setEventListeners(): void {
        document.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#addFieldBtn")) this.addNewField();
            if (target.closest("#openForm")) this.openFormData();
            if (target.closest("#closeForm")) this.closeFormData();
            if (target.closest("#openSearch")) this.openSearchData();
            if (target.closest("#closeSearch")) this.closeSearchData();
            if (target.closest("#delete-all")) await this.deleteAllItem();
        }, { signal: this.controller.signal });

        this.inputSection.addEventListener("submit", (event) => this.submitData(event), { 
            signal: this.controller.signal
        });

        this.searchSection.addEventListener("submit", (event) => this.filterData(event), { 
            signal: this.controller.signal
        });
    }

    private createInputField(value?: string): HTMLInputElement {
        const input = document.createElement('input');
        input.className = 'additional-detail';
        input.type = 'text';
        input.placeholder = 'Detail tambahan';
        if (value) input.value = value;
        return input;
    }

    private addNewField(): void {
        this.dynamicFields.appendChild(this.createInputField());
    }

    private async submitData(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const smallText = this.nameInput.value.toLowerCase();
        const data = await this.loadFromStorage() as Item[];
        const isExist = data.some(data => data.name.toLowerCase().includes(smallText));

        const newData: Omit<Item, 'id'> = {
            name: this.nameInput.value,
            detail: Array.from(document.querySelectorAll<HTMLInputElement>('#dynamicFields input'))
                .map((input: HTMLInputElement) => input.value.trim())
                .filter(v => v)
        }

        if (this.nameInput.value.trim().length === 0) {
            this.modalMessage.createModalComponent("input tidak boleh kosong!");
            return;
        }
        
        if (this.selectedId !== null) {
            await this.changeSelectedData(this.selectedId, newData);
        } else {
            if (!isExist) {
                await this.addToStorage(newData);
            } else {
                this.modalMessage.createModalComponent("Data sudah ada");
            }
        }

        this.resetForm();
    }

    private resetForm(): void {
        this.selectedId = null;
        this.inputSection.style.display = "none";
        this.inputSection.reset();
    }

    public async showAllData(): Promise<void> {
        const cardFragment = document.createDocumentFragment();

        await this.loadFromStorage((data, error) => {
            if (error) {
                const message = document.createElement("div");
                message.className = "message";
                message.textContent = `Error: ${error.message}`;
                this.errorNotification.appendChild(message);
                return;
            }

            if (data.length > 0) {
                data.forEach(dt => {
                    const getCardItem = this.createCardItem(dt);
                    cardFragment.appendChild(getCardItem);
                });
            } else {
                const empty = document.createElement("div") as HTMLDivElement;
                empty.className = "empty-list";
                
                const message = document.createElement("div");
                message.className = "message";
                message.textContent = "Daftar data kosong";
        
                empty.appendChild(message);
                cardFragment.appendChild(empty);
            }
        });

        this.itemsList.innerHTML = '';
        this.itemsList.appendChild(cardFragment);
    }

    private createCardItem(data: Item): HTMLDivElement {
        const card = document.createElement('div');
        card.className = 'item-card';

        const h3 = document.createElement("h3") as HTMLHeadingElement;
        h3.textContent = data.name;

        const detailsContainer = document.createElement('div');
        data.detail.forEach(dtl => {
            const p = document.createElement('p');
            p.textContent = `• ${dtl}`;
            detailsContainer.appendChild(p);
        });

        const buttonWrap = document.createElement("div");
        buttonWrap.className = "button-wrap";

        const editBtn = document.createElement("button") as HTMLButtonElement;
        editBtn.type = "button";
        editBtn.className = "edit-btn";
        editBtn.textContent = "Select";
        editBtn.addEventListener("click", async () => await this.selectedData(data.id), {
            signal: this.controller.signal
        });
        
        const deleteBtn = document.createElement("button") as HTMLButtonElement;
        deleteBtn.type = "button";
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", async () => await this.deleteItem(data.id), {
            signal: this.controller.signal
        });

        buttonWrap.append(editBtn, deleteBtn);
        card.append(h3, detailsContainer, buttonWrap);

        return card;
    }

    private async selectedData(id: string): Promise<void> {
        this.selectedId = id;
        this.dynamicFields.innerHTML = '';
        this.inputSection.style.display = "flex";
        const getAllData = await this.loadFromStorage() as Item[];;

        if (!getAllData) return;

        const data = getAllData.find(dt => dt.id === id); 

        if (!data) return;

        this.nameInput.value = data.name;
        data.detail.forEach(dtl => {
            this.dynamicFields.appendChild(this.createInputField(dtl));
        });
    }

    private filterData = async (event: SubmitEvent): Promise<void> => {
        event.preventDefault();
    
        if (this.searchData.value.trim().length === 0) {
            this.modalMessage.createModalComponent("input tidak boleh kosong!");
            return;
        }
    
        const keyword = this.searchData.value.toLowerCase();
        const getAllData = await this.loadFromStorage() as Item[];;
        const result = getAllData.filter(dt => dt.name.toLowerCase().includes(keyword));
    
        this.searchedData(result);
    }

    private searchedData(searched: Item[]): void {
        const filteredCard = document.createDocumentFragment();
        
        searched.forEach(search => {
            const getSearchedData = this.createCardItem(search);
            filteredCard.appendChild(getSearchedData);
        });
        
        this.itemsList.innerHTML = '';
        this.itemsList.appendChild(filteredCard);
    }

    private async deleteItem(id: string): Promise<void> {
        await this.deleteSelectedData(id); 
        if (this.selectedId === id) this.resetForm();
        this.modalMessage.createModalComponent("Data berhasil dihapus");
    }

    private async deleteAllItem(): Promise<void> {
        const data = await this.loadFromStorage()
        if (data.length > 0) {
            await this.deleteAllData();
            this.itemsList.replaceChildren();
            this.resetForm();
            this.modalMessage.createModalComponent("Data berhasil dihapus");
        } else {
            this.modalMessage.createModalComponent("Tambahkan minimal 1 data")
        }
    }

    public openFormData(): void {
        this.inputSection.style.display = "flex";
        this.searchSection.style.display = "none";
    }

    public closeFormData(): void {
        this.inputSection.style.display = "none";
        this.inputSection.reset();
        this.searchSection.reset();
        this.selectedId = null;
    }

    public openSearchData(): void {
        this.searchSection.style.display = "flex";
        this.inputSection.style.display = "none";
        this.selectedId = null;
    }

    public closeSearchData(): void {
        this.searchSection.style.display = "none";
        this.searchSection.reset();
        this.inputSection.reset();
        this.selectedId = null;
    }

    public cleanUp(): void {
        this.resetForm();
        this.closeSearchData();
        this.closeFormData();
        this.unsubscribe = null;
        this.controller.abort();
    }
}

export default DisplayManager;