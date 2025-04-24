// script.ts
interface DataItem {
    id: number;
    name: string;
    details: string[];
}

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
        const newItem = { ...item, id: Date.now() };
        this.data.push(newItem);
        this.saveToLocalStorage();
    }

    public updateItem(id: number, updatedItem: Omit<DataItem, 'id'>): void {
        const index = this.data.findIndex(item => item.id === id);
        if (index > -1) {
            this.data[index] = { ...updatedItem, id };
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

    public initialize(): void {
        this.renderList();
        this.setupForm();
    }

    private setupForm(): void {
        const nameInput = document.getElementById('nameInput') as HTMLInputElement;
        nameInput.value = '';
        document.getElementById('dynamicFields')!.innerHTML = '';
    }

    private createInputField(value?: string): HTMLInputElement {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Detail tambahan';
        if (value) input.value = value;
        return input;
    }

    public addNewField(): void {
        const container = document.getElementById('dynamicFields')!;
        container.appendChild(this.createInputField());
    }

    getFormData(): Omit<DataItem, 'id'> {
        const name = (document.getElementById('nameInput') as HTMLInputElement).value;
        const details = Array.from(document.querySelectorAll<HTMLInputElement>('#dynamicFields input'))
            .map((input: HTMLInputElement) => input.value.trim())
            .filter(v => v);

        return { name, details };
    }

    public renderList(): void {
        const container = document.getElementById('itemsList')!;
        container.innerHTML = '';

        this.dataManager.getAllItems().forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <h3>${item.name}</h3>
                ${item.details.map(d => `<p>• ${d}</p>`).join('')}
                <button onclick="handleEdit(${item.id})">Edit</button>
                <button onclick="handleDelete(${item.id})">Hapus</button>
            `;
            container.appendChild(card);
        });
    }

    public prepareEditForm(item: DataItem): void {
        const nameInput = document.getElementById('nameInput') as HTMLInputElement;
        nameInput.value = item.name;

        const fieldsContainer = document.getElementById('dynamicFields')!;
        fieldsContainer.innerHTML = '';
        item.details.forEach(detail => {
            fieldsContainer.appendChild(this.createInputField(detail));
        });

        this.dataManager.setEditingId(item.id);
    }
}

const displayManager = new DisplayManager();
displayManager.initialize();

function addNewField(): void {
    displayManager.addNewField();
}

function handleSubmit(): void {
    const dataManager = DataManager.getInstance();
    const formData = displayManager.getFormData();
    
    if (dataManager.getEditingId()) {
        dataManager.updateItem(dataManager.getEditingId()!, formData);
    } else {
        dataManager.addItem(formData);
    }
    
    dataManager.setEditingId(null);
    displayManager.initialize();
}

function handleEdit(id: number): void {
    const dataManager = DataManager.getInstance();
    const item = dataManager.getAllItems().find(i => i.id === id);
    if (item) {
        displayManager.prepareEditForm(item);
    }
}

function handleDelete(id: number): void {
    const dataManager = DataManager.getInstance();
    dataManager.deleteItem(id);
    displayManager.renderList();
}