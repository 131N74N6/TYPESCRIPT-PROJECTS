interface DataItem {
    id: number;
    name: string;
    details: string[];
}

const inputSection = document.getElementById("inputSection") as HTMLFormElement;
const nameInput = document.getElementById('nameInput') as HTMLInputElement;
const dynamicFields = document.getElementById("dynamicFields") as HTMLDivElement;

const searchSection = document.getElementById("searchSection") as HTMLFormElement;
const searchData = document.getElementById("searchData") as HTMLInputElement;

const itemsList = document.getElementById("itemsList") as HTMLElement;

class DataManager {
    private static instance: DataManager;
    private data: DataItem[] = [];
    private currentEditingId: number | null = null;

    private constructor() {
        this.loadFromLocalStorage();
    }

    public static getInstance(): DataManager {
        if (!DataManager.instance) {
            DataManager.instance = new DataManager();
        }
        return DataManager.instance;
    }

    private loadFromLocalStorage(): void {
        const saved = localStorage.getItem('items');
        this.data = saved ? JSON.parse(saved) : [];
    }

    private saveToLocalStorage(): void {
        localStorage.setItem('items', JSON.stringify(this.data));
    }

    public getAllItems(): DataItem[] {
        return [...this.data];
    }

    public addItem(item: Omit<DataItem, 'id'>): void {
        const newItem = { id: Date.now(), ...item };
        this.data.push(newItem);
        this.saveToLocalStorage();
    }

    public updateItem(id: number, updatedItem: Omit<DataItem, 'id'>): void {
        const index = this.data.findIndex(item => item.id === id);
        if (index > -1) {
            this.data[index] = { id, ...updatedItem };
            this.saveToLocalStorage();
        }
    }

    public deleteItem(id: number): void {
        this.data = this.data.filter(item => item.id !== id);
        this.saveToLocalStorage();
    }

    public setEditingId(id: number | null): void {
        this.currentEditingId = id;
    }

    public getEditingId(): number | null {
        return this.currentEditingId;
    }
}

class DisplayManager {
    private dataManager = DataManager.getInstance();

    constructor() {
        this.setEventListeners();
    }

    private setEventListeners(): void {
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            const cardId = Number(target.closest(".item-card")?.getAttribute("card-id"));
            
            if (target.classList.contains("edit-btn") && cardId) this.selectedData(cardId);
            if (target.classList.contains("delete-btn") && cardId) this.deleteData(cardId);
        });
    }

    private createInputField(value?: string): HTMLInputElement {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Detail tambahan';
        if (value) input.value = value;
        return input;
    }

    public addNewField(): void {
        dynamicFields.appendChild(this.createInputField());
    }

    public showAllData(): void {
        const cardFragment = document.createDocumentFragment();
        const data = this.dataManager.getAllItems();

        data.forEach(dt => {
            const getCardItem = this.createCardItem(dt);
            cardFragment.appendChild(getCardItem);
        });

        itemsList.innerHTML = '';
        itemsList.appendChild(cardFragment);
    }

    public createCardItem(data: DataItem): HTMLDivElement {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.setAttribute("card-id", String(data.id))
        card.innerHTML = `
            <h3>${data.name}</h3>
            ${data.details.map(d => `<p>• ${d}</p>`).join('')}
            <button type="button" class="edit-btn">Edit</button>
            <button type="button" class="delete-btn">Hapus</button>
        `;

        return card;
    }

    private selectedData(id: number): void {
        dynamicFields.innerHTML = '';
        inputSection.style.display = "flex";
        const data = this.dataManager.getAllItems().find(dt => dt.id === id); 

        if (!data) return;

        nameInput.value = data.name;
        data.details.forEach(detail => {
            dynamicFields.appendChild(this.createInputField(detail));
        });
        this.dataManager.setEditingId(id);
    }

    public searchedData(searched: DataItem[]): void {
        const filteredCard = document.createDocumentFragment();
        
        searched.forEach(search => {
            const getSearchedData = this.createCardItem(search);
            filteredCard.appendChild(getSearchedData);
        });
        
        itemsList.appendChild(filteredCard);
        itemsList.innerHTML = searched.length > 0 ? '' : '<p class="empty-message">Tidak ada hasil ditemukan</p>';
    }

    private deleteData(id: number): void {
        this.dataManager.deleteItem(id);
        this.showAllData();
    }

    public openFormData(): void {
        inputSection.style.display = "flex";
        searchSection.style.display = "none";
    }

    public closeFormData(): void {
        inputSection.style.display = "none";
        inputSection.reset();
        searchSection.reset();
        this.dataManager.setEditingId(null);
    }

    public openSearchData(): void {
        searchSection.style.display = "flex";
        inputSection.style.display = "none";
        this.dataManager.setEditingId(null);
    }

    public closeSearchData(): void {
        searchSection.style.display = "none";
        searchSection.reset();
        inputSection.reset();
        this.showAllData();
        this.dataManager.setEditingId(null);
    }
}

let displayManager : DisplayManager;
let abortController : AbortController;

const setServices = (): void => {
    displayManager = new DisplayManager();
}

const setDataAndUI = (): void => {
    displayManager.showAllData();
}

const submitData = (event: SubmitEvent): void => {
    event.preventDefault();
    const dataManager = DataManager.getInstance();
    const smallText = nameInput.value.toLowerCase();
    const isExist = dataManager.getAllItems().some(data => data.name.toLowerCase().includes(smallText));

    const newData: DataItem = {
        id: DataManager.getInstance().getEditingId() || Date.now(),
        name: nameInput.value,
        details: Array.from(document.querySelectorAll<HTMLInputElement>('#dynamicFields input'))
            .map((input: HTMLInputElement) => input.value.trim())
            .filter(v => v)
    }

    if (nameInput.value.trim().length === 0) {
        console.log("input tidak boleh kosong!");
        return;
    }
    
    if (dataManager.getEditingId()) {
        const selectedData = document.querySelector(`[card-id="${newData.id}"]`) as HTMLElement;

        if (selectedData)  selectedData.innerHTML = displayManager.createCardItem(newData).innerHTML;

        dataManager.updateItem(dataManager.getEditingId() as number, newData);
    } else {
        if (!isExist) {
            dataManager.addItem(newData);
            itemsList.appendChild(displayManager.createCardItem(newData));
        } else {
            console.log("Data sudah ada");
        }
    }
    
    dataManager.setEditingId(null);
    inputSection.style.display = "none";
    inputSection.reset();
}

const filterData = (event: SubmitEvent): void => {
    event.preventDefault();

    if (nameInput.value.trim().length === 0) {
        console.log("input tidak boleh kosong!");
        return;
    }

    const keyword = searchData.value.toLowerCase();
    const data = DataManager.getInstance().getAllItems();
    const result = data.filter(dt => dt.name.toLowerCase().includes(keyword));

    displayManager.searchedData(result);
}

const setEventListener = () => {
    abortController = new AbortController();
    const { signal } = abortController;

    document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;

        if (target.closest("#addFieldBtn")) displayManager.addNewField();
        if (target.closest("#openForm")) displayManager.openFormData();
        if (target.closest("#closeForm")) displayManager.closeFormData();
        if (target.closest("#openSearch")) displayManager.openSearchData();
        if (target.closest("#closeSearch")) displayManager.closeSearchData();
    }, { signal });
    
    inputSection.addEventListener("submit", submitData, { signal });
    searchSection.addEventListener("submit", filterData, { signal });
}

const init = (): void => {
    setServices();
    setDataAndUI();
    setEventListener();
}

const cleanUp = (): void => {
    abortController?.abort();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", cleanUp);