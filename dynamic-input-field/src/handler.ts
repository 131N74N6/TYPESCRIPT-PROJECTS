import DataManager from "./storage";

interface DataItem {
    id: string;
    name: string;
    details: string[];
}

class DisplayManager extends DataManager<DataItem> {
    private controller: AbortController = new AbortController();
    private inputSection: HTMLFormElement;
    private nameInput: HTMLInputElement;
    private dynamicFields: HTMLDivElement;
    private searchSection: HTMLFormElement;
    private searchData: HTMLInputElement;
    private itemsList: HTMLElement;
    private selectedId: null | string;

    constructor(
        inputSection: HTMLFormElement, nameInput: HTMLInputElement, dynamicFields: HTMLDivElement, 
        searchSection: HTMLFormElement, searchData: HTMLInputElement, itemsList: HTMLElement
    ) {
        super("dynamic input field");
        this.inputSection = inputSection;
        this.nameInput = nameInput;
        this.dynamicFields = dynamicFields;
        this.searchSection = searchSection;
        this.searchData = searchData;
        this.itemsList = itemsList
        this.setEventListeners();
    }

    private setEventListeners(): void {
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            const getAllData = Array.from(document.querySelectorAll(".item-card"));

            const selectButton = target.closest(".edit-btn");
            const deleteButton = target.closest(".delete-btn");

            const getSelectedData = selectButton?.closest(".item-card");
            const deleteOneData = deleteButton?.closest(".item-card");

            const getSelectedIndex = getAllData.indexOf(getSelectedData as Element);
            const getIndexToRemove = getAllData.indexOf(deleteOneData as Element);

            if (getSelectedIndex > -1) {
                const dataDetail = this.getAllItems()[getSelectedIndex];
                this.selectedData(dataDetail.id);
            }
            if (getIndexToRemove > -1) {
                const dataDetail = this.getAllItems()[getIndexToRemove];
                this.deleteData(dataDetail.id);
            }
            if (target.closest("#addFieldBtn")) this.addNewField();
            if (target.closest("#openForm")) this.openFormData();
            if (target.closest("#closeForm")) this.closeFormData();
            if (target.closest("#openSearch")) this.openSearchData();
            if (target.closest("#closeSearch")) this.closeSearchData();
            if (target.closest("#delete-all")) this.deleteAllData();
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

    private submitData(event: SubmitEvent): void {
        event.preventDefault();
        const smallText = nameInput.value.toLowerCase();
        const isExist = this.getAllItems().some(data => data.name.toLowerCase().includes(smallText));
        const isInEditMode = !!this.getEditingId();

        const newData: ForInput = {
            name: nameInput.value,
            details: Array.from(document.querySelectorAll<HTMLInputElement>('#dynamicFields input'))
                .map((input: HTMLInputElement) => input.value.trim())
                .filter(v => v)
        }

        if (nameInput.value.trim().length === 0) {
            new Modal("input tidak boleh kosong!");
            return;
        }
        
        if (isInEditMode) {
            this.updateItem(this.getEditingId() as number, newData);
        } else {
            if (!isExist) {
                this.addItem(newData);
            } else {
                new Modal("Data sudah ada");
            }
        }

        this.showAllData();
        this.resetForm();
    }

    private resetForm(): void {
        this.selectedId = null;
        this.inputSection.style.display = "none";
        this.inputSection.reset();
    }

    public showAllData(): void {
        const cardFragment = document.createDocumentFragment();
        const data = this.getAllItems();

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

        this.itemsList.innerHTML = '';
        this.itemsList.appendChild(cardFragment);
    }

    private createCardItem(data: DataItem): HTMLDivElement {
        const card = document.createElement('div');
        card.className = 'item-card';

        const h3 = document.createElement("h3") as HTMLHeadingElement;
        h3.textContent = data.name;

        const detailsContainer = document.createElement('div');
        data.details.forEach(detail => {
            const p = document.createElement('p');
            p.textContent = `• ${detail}`;
            detailsContainer.appendChild(p);
        });

        const buttonWrap = document.createElement("div");
        buttonWrap.className = "button-wrap";

        const editBtn = document.createElement("button") as HTMLButtonElement;
        editBtn.type = "button";
        editBtn.className = "edit-btn";
        editBtn.textContent = "Edit";
        
        const deleteBtn = document.createElement("button") as HTMLButtonElement;
        deleteBtn.type = "button";
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Hapus";

        buttonWrap.append(editBtn, deleteBtn);
        card.append(h3, detailsContainer, buttonWrap);

        return card;
    }

    private selectedData(id: string): void {
        this.selectedId = id;
        this.dynamicFields.innerHTML = '';
        this.inputSection.style.display = "flex";

        const data = this.getAllItems().find(dt => dt.id === id); 

        if (!data) return;

        this.nameInput.value = data.name;
        data.details.forEach(detail => {
            this.dynamicFields.appendChild(this.createInputField(detail));
        });
    }

    private filterData = (event: SubmitEvent): void => {
        event.preventDefault();
    
        if (searchData.value.trim().length === 0) {
            new Modal("input tidak boleh kosong!");
            return;
        }
    
        const keyword = searchData.value.toLowerCase();
        const data = this.getAllItems();
        const result = data.filter(dt => dt.name.toLowerCase().includes(keyword));
    
        this.searchedData(result);
    }

    private searchedData(searched: DataItem[]): void {
        const filteredCard = document.createDocumentFragment();
        
        searched.forEach(search => {
            const getSearchedData = this.createCardItem(search);
            filteredCard.appendChild(getSearchedData);
        });
        
        this.itemsList.innerHTML = '';
        this.itemsList.appendChild(filteredCard);
    }

    private deleteData(id: number): void {
        this.deleteItem(id); 

        if (this.getEditingId() === id) this.resetForm();
        
        this.showAllData();
        new Modal("Data berhasil dihapus");
    }

    protected deleteAllData(): void {
        const data = this.getAllItems();
        if (data.length > 0) {
            this.deleteAllItems();
            itemsList.replaceChildren();
            this.resetForm();
            new Modal("Data berhasil dihapus");
        } else {
            new Modal("Tambahkan minimal 1 data")
        }
        this.showAllData();
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
        this.showAllData();
        this.selectedId = null;
    }

    public cleanUp(): void {
        this.resetForm();
        this.closeSearchData();
        this.closeFormData();
        this.controller.abort();
    }
}

export default DisplayManager;