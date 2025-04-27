interface DataItem {
    id: number;
    name: string;
    details: string[];
}

class DataManager {
    private static instance: DataManager;
    data: DataItem[] = [];
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

    public deleteAllItems(): void {
        localStorage.removeItem('items');
    }

    public setEditingId(id: number | null): void {
        this.currentEditingId = id;
    }

    public getEditingId(): number | null {
        return this.currentEditingId;
    }
}

export { DataItem, DataManager }