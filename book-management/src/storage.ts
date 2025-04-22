class DataStorage<T extends { id: number }> {
    private key: string;

    constructor(storageKey: string) {
        this.key = storageKey;
    }

    saveToStorage(data: T[]): void {
        localStorage.setItem(this.key, JSON.stringify(data));
    }

    private getFromStorage(): T[] {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    }

    private deleteStorage(): void {
        localStorage.removeItem(this.key);
    }

    add(item: T): void {
        const items = this.getFromStorage();
        items.push(item);
        this.saveToStorage(items);
    }

    delete(id: number): void {
        const items = this.getFromStorage();
        const index = items.findIndex(item => item.id === id);
        items.splice(index, 1);
        this.saveToStorage(items);
    }

    deleteAll(): void {
        this.deleteStorage();
    }

    getAll(): T[] {
        return this.getFromStorage();
    }
}

export default DataStorage;