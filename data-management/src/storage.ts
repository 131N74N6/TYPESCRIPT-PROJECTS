interface DataItem {
    id: number;
    name: string;
    details: string[];
}

type ForInput = Omit<DataItem, "id">;

class DataManager {
    protected storageKey;
    private data: DataItem[] = [];
    private currentEditingId: number | null = null;

    constructor(storageKey: string) {
        this.storageKey = storageKey;
        this.loadFromLocalStorage();
    }

    private loadFromLocalStorage(): void {
        const saved = localStorage.getItem(this.storageKey);
        this.data = saved ? JSON.parse(saved) : [];
    }

    private saveToLocalStorage(): void {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    public getAllItems(): DataItem[] {
        return [...this.data];
    }

    protected addItem(item: Omit<DataItem, 'id'>): void {
        const newItem = { id: Date.now(), ...item };
        this.data.push(newItem);
        this.saveToLocalStorage();
    }

    protected updateItem(id: number, updatedItem: Omit<DataItem, 'id'>): void {
        const index = this.data.findIndex(item => item.id === id);
        if (index > -1) {
            this.data[index] = { id, ...updatedItem };
            this.saveToLocalStorage();
        }
    }

    protected deleteItem(id: number): void {
        this.data = this.data.filter(item => item.id !== id);
        this.saveToLocalStorage();
    }

    protected deleteAllItems(): void {
        this.data = [];
        localStorage.removeItem(this.storageKey);
    }

    protected setEditingId(id: number | null): void {
        this.currentEditingId = id;
    }

    protected getEditingId(): number | null {
        return this.currentEditingId;
    }
}

export { DataItem, DataManager, ForInput }