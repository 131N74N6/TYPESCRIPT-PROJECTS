import DataManager from "./storage";
import Modal from "./components/modal";
import ErrorMessage from "./components/error-message";
import type Item from "./model/item";

const searchSection = document.getElementById("searchSection") as HTMLFormElement;
const searchData = document.getElementById("searchData") as HTMLInputElement;

const itemsList = document.getElementById("itemsList") as HTMLElement;
const modalMessage = document.getElementById("modal-msg") as HTMLElement;
const errorNotification = document.getElementById("error-notification") as HTMLElement;

class DisplayManager extends DataManager<Item> {
    private controller: AbortController = new AbortController();
    private itemsList: HTMLElement;
    private modalMessage: Modal;
    private selectedId: null | string = null;
    private errorNotification: ErrorMessage;

    constructor() {
        super("dynamic input field");
        this.itemsList = itemsList
        this.modalMessage = new Modal(modalMessage);
        this.errorNotification = new ErrorMessage(errorNotification);
        this.setEventListeners();
        this.setupRealtimeListener();
    }

    private setEventListeners(): void {
        document.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            
            if (target.closest("#delete-all")) await this.deleteAllItem();
        }, { signal: this.controller.signal });

        searchSection.addEventListener("submit", (event) => this.filterData(event), { 
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

    private async submitData(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const smallText = this.nameInput.value.toLowerCase();
        const data = await this.loadFromStorage();
        const isExist = data.some(data => data.name.toLowerCase().includes(smallText));

        const newData: Omit<Item, 'id'> = {
            name: this.nameInput.value,
            detail: Array.from(document.querySelectorAll<HTMLInputElement>('#dynamicFields input'))
                .map((input: HTMLInputElement) => input.value.trim())
                .filter(v => v)
        }

        if (this.nameInput.value.trim().length === 0) {
            this.modalMessage.createModalComponent("input tidak boleh kosong!");
            this.modalMessage.showModal();
            return;
        }
        
        if (this.selectedId !== null) {
            try {
                await this.changeSelectedData(this.selectedId, newData);
            } catch (error) {
                this.errorNotification.createAndshowError(`Error: ${error}`);
            }
        } else {
            try {
                !isExist ? await this.addToStorage(newData) : 
                this.modalMessage.createModalComponent("Data sudah ada");
                this.modalMessage.showModal();
            } catch (error) {
                this.errorNotification.createAndshowError(`Error: ${error}`);
            }
        }

        this.resetForm();
    }

    private resetForm(): void {
        this.selectedId = null;
    }

    private setupRealtimeListener(): void {
        this.loadFromStorage((data) => this.renderItem(data));
    }

    public showAllData(): void {
        const cardFragment = document.createDocumentFragment();

        this.loadFromStorage((data, error) => {
            if (error) {
                this.errorNotification.createAndshowError(`Error: ${error.message}`);
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
    
    private renderItem(data: Item[]): void {
        const fragment = document.createDocumentFragment();
        data.forEach(item => fragment.appendChild(this.createCardItem(item)));
        this.itemsList.innerHTML = '';
        this.itemsList.appendChild(fragment);
    }

    private async selectedData(id: string): Promise<void> {
        this.selectedId = id;
        this.dynamicFields.innerHTML = '';
        this.inputSection.style.display = "flex";
        const getAllData = await this.loadFromStorage();

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
    
        if (searchData.value.trim().length === 0) {
            this.modalMessage.createModalComponent("input tidak boleh kosong!");
            this.modalMessage.showModal();
            return;
        }
    
        const keyword = searchData.value.toLowerCase();
        const getAllData = await this.loadFromStorage();
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
        try {
            await this.deleteSelectedData(id); 
            if (this.selectedId === id) this.resetForm();
            this.modalMessage.createModalComponent("Data berhasil dihapus");
            this.modalMessage.showModal();
        } catch (error) {
            this.errorNotification.createAndshowError(`Error: ${error}`);
        }
    }

    private async deleteAllItem(): Promise<void> {
        const data = await this.loadFromStorage();
        try {
            if (data.length > 0) {
                await this.deleteAllData();
                this.itemsList.replaceChildren();
                this.resetForm();
                this.modalMessage.createModalComponent("Data berhasil dihapus");
                this.modalMessage.showModal();
            } else {
                this.modalMessage.createModalComponent("Tambahkan minimal 1 data")
                this.modalMessage.showModal();
            }
        } catch (error) {
            this.errorNotification.createAndshowError(`Error: ${error}`);
        }
    }

    public openFormData(): void {
        searchSection.style.display = "none";
    }

    public closeFormData(): void {
        searchSection.reset();
        this.selectedId = null;
    }

    public openSearchData(): void {
        this.selectedId = null;
    }

    public closeSearchData(): void {
        searchSection.style.display = "none";
        searchSection.reset();
        this.selectedId = null;
    }

    public cleanUp(): void {
        this.resetForm();
        this.closeSearchData();
        this.modalMessage.teardownModal();
        this.closeFormData();
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.controller.abort();
    }
}

export default DisplayManager;