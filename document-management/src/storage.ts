type DataManager <N extends { id: string }> = {
    data: N[];
    loadFromStorage: () => void;
    saveToStorage: () => void;
    addToStorage: (new_info: Omit<N, 'id'>) => void;
    changeSelectedData: (id: string, new_info: Partial<N>) => void;
    deleteSelectedData: (id: string) => void;
    deleteAllData: () => void;
}

function DataStorages<N extends { id: string }>(storageKey: string): DataManager<N> {
    const manager = {
        data: [] as N[],

        loadFromStorage(): void {
            const savedData = localStorage.getItem(storageKey);
            this.data = savedData ? JSON.parse(savedData) : []
        },

        saveToStorage(): void {
            localStorage.setItem(storageKey, JSON.stringify(this.data))
        },

        addToStorage(new_info: Omit<N, 'id'>): void {
            const newData = { id: crypto.randomUUID(), ...new_info } as N;
            this.data.push(newData);
            this.saveToStorage();
        },

        changeSelectedData(id: string, new_info: Partial<N>) {
            const index = this.data.findIndex(data => data.id === id);
            const newData = { ...this.data[index], ...new_info } as N;

            if (index > -1) {
                this.data[index] = newData;
                this.saveToStorage();
            }
        },

        deleteSelectedData(id: string): void {
            this.data = this.data.filter(dt => dt.id !== id);
            this.saveToStorage();
        },

        deleteAllData(): void {
            this.data = [];
            localStorage.removeItem(storageKey);
        }
    }

    return manager;
}

export default DataStorages;