class DataManager <V extends { id: string }> {
    private key: string;
    private data: V[] = [];

    constructor(key: string) {
        this.key = key;
        this.loadDataFromStorage();
    }

    private loadDataFromStorage(): void {
        const loadData = localStorage.getItem(this.key);
        this.data = loadData ? JSON.parse(loadData) : [];
    }

    private saveToStorage(): void {
        localStorage.setItem(this.key, JSON.stringify(this.data));
    }

    protected getAllData(): V[] {
        return [...this.data]
    }

    protected addNewData(item: Omit<V, 'id'>): void {
        const newData = { id: Date.now().toString(), ...item } as V;
        this.data.push(newData);
        this.saveToStorage();
    }

    protected changeSelectedData(id: string, item: Omit<V, 'id'>): void {
        const index = this.data.findIndex(dt => dt.id === id);
        const newData = { id: Date.now().toString(), ...item } as V;
        this.data[index] = newData;
        this.saveToStorage();
    }

    protected deleteSelectedData(id: string): void {
        const index = this.data.findIndex(dt => dt.id === id);
        this.data.splice(index, 1);
        this.saveToStorage();
    }

    protected deleteAllData(): void {
        localStorage.removeItem(this.key);
    }
}

export default DataManager;