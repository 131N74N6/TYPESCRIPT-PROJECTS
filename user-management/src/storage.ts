class DataStorage<A extends { id: number }> {
    private key: string;
    private data: A[] = [];
    protected selectedId: number | null = null;

    constructor(storageKey: string) {
        this.key = storageKey;
        this.loadFromStorage();
    }

    private loadFromStorage(): void {
        const item = localStorage.getItem(this.key);
        this.data = item ? JSON.parse(item) : [];
    }

    saveToStorage(): void {
        localStorage.setItem(this.key, JSON.stringify(this.data));
    }

    private deleteAllFromStorage(): void {
        localStorage.removeItem(this.key);
    }

    getAllData(): A[] {
        return [...this.data];
    }

    add(info: Omit<A, 'id'>): void {
        const data = this.getAllData();
        const newData = { id: Date.now(), ...info } as A;
        data.push(newData);
        this.saveToStorage();
    }

    changeData(id: number, detail: Omit<A, 'id'>): void {
        const data = this.getAllData();
        const index = data.findIndex(dt => dt.id === id);
        const newData = { id: Date.now(), ...detail } as A;

        if (index !== -1) {
            data[index] = newData;
            this.saveToStorage();
        }
    }

    deleteData(id: number): void {
        const data = this.getAllData();
        const index = data.findIndex(dt => dt.id === id);
        data.splice(index, 1);
        this.saveToStorage();
    }

    deleteAllData(): void {
        this.data = [];
        this.deleteAllFromStorage();
    }

    setSelectedId(id: number | null): void {
        this.selectedId = id;
    }

    getSelectedId(): number | null {
        return this.selectedId;
    }
}

export default DataStorage;