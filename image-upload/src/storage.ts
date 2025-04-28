interface Item {
    id: string;
    imgName: string;
    category: 'anime' | 'buildings/urbans' | 'nature';
    image: string;
}

type ItemInput = Omit<Item, 'id'>; 

class DataStorage {
    private imageItems: Item[] = [];
    private selectedId: string | null = null;
    private storageKey: string;

    constructor (storageKey: string) {
        this.storageKey = storageKey;
        this.loadFromStorages();
    }

    private loadFromStorages(): void {
        const data = localStorage.getItem(this.storageKey);
        this.imageItems = data ? JSON.parse(data) : [];
    }

    private saveToStorages(): void {
        localStorage.setItem(this.storageKey, JSON.stringify(this.imageItems));
    }

    addDataToStorages(item: ItemInput): void {
        const newData = { id: Date.now().toString(), ...item };
        this.imageItems.push(newData);
        this.saveToStorages();
    }

    changeSelectedData(id: string, item: ItemInput): void {
        const index = this.imageItems.findIndex(image => image.id === id);
        if (index !== -1) {
            const newData = { id, ...item };
            this.imageItems[index] = newData;
            this.saveToStorages();
        }
    }

    getAllData(): Item[] {
        return [...this.imageItems];
    }

    deleteFromStorages(id: string): void {
        const index = this.imageItems.findIndex(image => image.id === id);
        this.imageItems.splice(index, 1);
        this.saveToStorages();
    }

    deleteAllFromStorages(): void {
        this.imageItems = [];
        localStorage.removeItem(this.storageKey);
    }

    setSelectedId(id: string | null): void {
        this.selectedId = id;
    }

    getSelectedId(): string | null {
        return this.selectedId;
    }
}

export { DataStorage, Item, ItemInput }