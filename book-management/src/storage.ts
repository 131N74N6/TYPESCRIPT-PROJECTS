class DataStorage<S extends { id: number }> {
    private key: string;
    protected data: S[] = [];
    protected selectedItemId: number | null = null;

    protected constructor(storageKey: string) {
        this.key = storageKey;
        this.loadFromStorage();
    }
    
    private loadFromStorage(): void {
        const loadData = localStorage.getItem(this.key);
        this.data = loadData ? JSON.parse(loadData) : [];
    }

    private saveToStorage(): void {
        localStorage.setItem(this.key, JSON.stringify(this.data));
    }

    getAll(): S[] {
        return [...this.data];
    }

    protected addData(item: Omit<S, 'id'>): void {
        const newData = { id: Date.now(), ...item } as S;
        this.data.push(newData);
        this.saveToStorage();
    }

    protected changeSelectedData(id: number, item: Omit<S, 'id'>): void {
        const index = this.data.findIndex(selected => selected.id === id);
        const newData = { id, ...item } as S;
        this.data[index] = newData;
        this.saveToStorage();
    }

    protected delete(id: number): void {
        const index = this.data.findIndex(item => item.id === id);
        this.data.splice(index, 1);
        this.saveToStorage();
    }

    protected deleteAll(): void {
        this.data = [];
        localStorage.removeItem(this.key);
    }

    protected setSelectedId(selectedItemId: number | null): void {
        this.selectedItemId = selectedItemId;
    }

    protected getSelectedId(): number | null {
        return this.selectedItemId;
    }
}

export default DataStorage;