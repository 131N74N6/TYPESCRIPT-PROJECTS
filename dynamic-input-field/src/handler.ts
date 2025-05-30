import Modal from "./modal";
import DataManager from "./storage";
import ErrorMessage from "./error";

interface Data {
    id: string;
    name: string;
    detail: string[];
}

class DisplayManager extends DataManager<Data> {
    private controller: AbortController = new AbortController();
    private getSelectedId: string | null = null
    private inputSection: HTMLFormElement;
    private nameInput: HTMLInputElement;
    private dynamicFields: HTMLDivElement;
    private searchSection: HTMLFormElement;
    private searchData: HTMLInputElement;
    private itemsList: HTMLElement;
    private dataNotification: Modal;
    private errorNotification: ErrorMessage;
    private currentData: Data[] = [];

    constructor(
        inputSection: HTMLFormElement, nameInput: HTMLInputElement, dynamicFields: HTMLDivElement, 
        searchSection: HTMLFormElement, searchData: HTMLInputElement, itemsList: HTMLElement, 
        notification: HTMLElement, errorNotification: HTMLElement
    ) {
        super("dynamic input field");
        this.inputSection = inputSection;
        this.nameInput = nameInput;
        this.dynamicFields = dynamicFields;
        this.searchSection = searchSection;
        this.searchData = searchData;
        this.itemsList = itemsList;
        this.dataNotification = new Modal(notification);
        this.errorNotification = new ErrorMessage(errorNotification);
    }

    setEventListeners(): void {
        this.realtimeInit((data, error) => {
            if (error) {
                this.errorNotification.createAndshowError(`Error: ${error.message}`);
                return;
            }

            this.currentData = data;
            this.showAllData();
        });
        document.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#addFieldBtn")) this.addNewField();
            if (target.closest("#openForm")) this.openFormData();
            if (target.closest("#closeForm")) this.closeFormData();
            if (target.closest("#openSearch")) this.openSearchData();
            if (target.closest("#closeSearch")) this.closeSearchData();
            if (target.closest("#delete-all")) await this.deleteAllData();
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
        const isExist = this.currentData.some(data => data.name.toLowerCase().includes(smallText));

        const newData: Omit<Data, 'id'> = {
            name: this.nameInput.value,
            detail: Array.from(document.querySelectorAll<HTMLInputElement>('#dynamicFields input'))
                .map((input: HTMLInputElement) => input.value.trim())
                .filter(v => v)
        }

        if (this.nameInput.value.trim().length === 0) {
            this.dataNotification.createModalComponent("input tidak boleh kosong!");
            this.dataNotification.showModal();
            return;
        }
        
        if (this.getSelectedId !== null) {
            await this.changeSelectedData(this.getSelectedId, newData);
        } else {
            if (!isExist) {
                await this.addToStorage(newData);
            } else {
                this.dataNotification.createModalComponent("Data sudah ada");
                this.dataNotification.showModal();
            }
        }

        this.resetForm();
    }

    private resetForm(): void {
        this.getSelectedId = null
        this.inputSection.style.display = "none";
        this.inputSection.reset();
    }

    public showAllData(): void {
        const cardFragment = document.createDocumentFragment();

        if (this.currentData.length > 0) {
            this.currentData.forEach(dt => {
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

        this.itemsList.innerHTML = '';
        this.itemsList.appendChild(cardFragment);
    }

    private createCardItem(data: Data): HTMLDivElement {
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

        const selectButton = document.createElement("button") as HTMLButtonElement;
        selectButton.type = "button";
        selectButton.className = "edit-btn";
        selectButton.textContent = "Edit";
        selectButton.addEventListener("click", async () => await this.selectedItem(data.id), {
            signal: this.controller.signal
        });
        
        const deleteBtn = document.createElement("button") as HTMLButtonElement;
        deleteBtn.type = "button";
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Hapus";
        deleteBtn.addEventListener("click", async () => await this.deleteItem(data.id), {
            signal: this.controller.signal
        });

        buttonWrap.append(selectButton, deleteBtn);
        card.append(h3, detailsContainer, buttonWrap);

        return card;
    }

    private selectedItem(id: string): void {
        this.dynamicFields.innerHTML = '';
        this.inputSection.style.display = "flex";
        const getAllData = this.currentData.find(dt => dt.id === id); 

        if (!getAllData) return;

        this.nameInput.value = getAllData.name;
        getAllData.detail.forEach(dtl => {
            this.dynamicFields.appendChild(this.createInputField(dtl));
        });

        this.getSelectedId = id;
    }

    private async filterData (event: SubmitEvent): Promise<void> {
        event.preventDefault();
    
        if (this.searchData.value.trim().length === 0) {
            this.dataNotification.createModalComponent("input tidak boleh kosong!");
            this.dataNotification.showModal();
            return;
        }
    
        const keyword = this.searchData.value.toLowerCase();
        const result = this.currentData.filter(dt => dt.name.toLowerCase().includes(keyword));
    
        this.searchedData(result);
    }

    private searchedData(searched: Data[]): void {
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

        if (this.getSelectedId === id) this.resetForm();
        
        this.dataNotification.createModalComponent("Data berhasil dihapus");
        this.dataNotification.showModal();
    }

    protected async deleteAllItem(): Promise<void> {;
        if (this.currentData.length > 0) {
            await this.deleteAllData();
            this.itemsList.replaceChildren();
            this.resetForm();
            this.dataNotification.createModalComponent("Data berhasil dihapus");
            this.dataNotification.showModal();
        } else {
            this.dataNotification.createModalComponent("Tambahkan minimal 1 data");
            this.dataNotification.showModal();
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
        this.getSelectedId = null;
    }

    public openSearchData(): void {
        this.searchSection.style.display = "flex";
        this.inputSection.style.display = "none";
        this.getSelectedId = null;
    }

    public closeSearchData(): void {
        this.searchSection.style.display = "none";
        this.searchSection.reset();
        this.inputSection.reset();
        this.getSelectedId = null;
        this.showAllData();
    }

    public cleanUp(): void {
        this.controller.abort();
        this.dataNotification.teardownModal();
        this.resetForm();
    }
}

export default DisplayManager;