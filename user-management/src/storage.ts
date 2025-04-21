class DataStorage<A extends { id: number }>{
    private key: string;

    constructor(storageKey: string) {
        this.key = storageKey;
    }

    private getDataFromStorage(): A[] {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    }

    saveToStorage(data: A[]): void {
        localStorage.setItem(this.key, JSON.stringify(data));
    }

    private deleteAllFromStorage(): void {
        localStorage.removeItem(this.key);
    }

    getAllData(): A[] {
        return this.getDataFromStorage();
    }

    add(info: A): void {
        const data = this.getDataFromStorage();
        data.push(info);
        this.saveToStorage(data);
    }

    deleteData(id: number): void {
        const data = this.getDataFromStorage();
        const index = data.findIndex(dt => dt.id === id);
        data.splice(index, 1);
        this.saveToStorage(data);
    }

    deleteAllData(): void {
        this.deleteAllFromStorage();
    }
}

export default DataStorage;