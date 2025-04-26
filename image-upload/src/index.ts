type Item = {
    id: string;
    name: string;
    category: 'electronics' | 'fashion';
    image: string;
}
  
type ItemInput = Omit<Item, 'id'>; // Untuk form input (tanpa ID)
type PartialItem = Partial<Item>; // Untuk update data
  
class DataManager {
    private items: Item[] = [];
    private selectedCategory: string[] = ['electronics', 'fashion'];
    private currentEditingId: string | null = null;
  
    constructor() {
        this.loadFromLocalStorage();
        this.initEventListeners();
        this.renderItems();
    }
  
    private loadFromLocalStorage() {
        const saved = localStorage.getItem('items');
        if (saved) this.items = JSON.parse(saved);
    }
  
    private saveToLocalStorage() {
        localStorage.setItem('items', JSON.stringify(this.items));
    }
  
    private async readImage(file: File): Promise<string> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.readAsDataURL(file);
        });
    }
  
    async addItem(itemData: ItemInput) {
        const newItem: Item = { id: Date.now().toString(), ...itemData };
        this.items = [...this.items, newItem];
        this.saveToLocalStorage();
    }
  
    updateItem(id: string, updates: PartialItem) {
        this.items = this.items.map(item => item.id === id ? {...item, ...updates} : item);
        this.saveToLocalStorage();
    }
  
    deleteItem(id: string) {
      this.items = this.items.filter(item => item.id !== id);
      this.saveToLocalStorage();
    }
  
    private shouldRender(newItems: Item[]): boolean {
        return newItems.length !== this.items.length || 
        newItems.some((item, i) => item.id !== this.items[i]?.id);
    }
  
    private renderItems() {
        const filtered = this.items.filter(item => this.selectedCategory.includes(item.category));

        if (!this.shouldRender(filtered)) return;

        const container = document.getElementById('itemsContainer') as HTMLElement;
        container.innerHTML = filtered.map(item => `
            <div class="item-card" data-id="${item.id}">
            <h3>${item.name}</h3>
            <img class="image-preview" src="${item.image}" alt="${item.name}">
            <p>Kategori: ${item.category}</p>
            <button class="editBtn">Edit</button>
            <button class="deleteBtn">Hapus</button>
            </div>
        `).join('');
        
        filtered.forEach(item => {
            const card = document.querySelector(`[data-id="${item.id}"]`)!;
            card.querySelector('.deleteBtn')!.addEventListener('click', () => {
                this.deleteItem(item.id);
                this.renderItems();
            });
        
            card.querySelector('.editBtn')!.addEventListener('click', () => {
                this.currentEditingId = item.id;
                (document.getElementById('name') as HTMLInputElement).value = item.name;
                (document.getElementById('category') as HTMLSelectElement).value = item.category;
            });
        });
    }
  
    // 6. Event listeners dan inisialisasi
    private initEventListeners() {
        document.getElementById('dataForm')!.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const name = (document.getElementById('name') as HTMLInputElement).value;
            const category = (document.getElementById('category') as HTMLSelectElement).value;
            const imageFile = (document.getElementById('image') as HTMLInputElement).files?.[0];
            
            if (imageFile) {
            const image = await this.readImage(imageFile);
            const itemData: ItemInput = { name, category: category as any, image };
            
            if (this.currentEditingId) {
                this.updateItem(this.currentEditingId, itemData);
                this.currentEditingId = null;
            } else {
                await this.addItem(itemData);
            }
            
            this.renderItems();
            (event.target as HTMLFormElement).reset();
        }
    });
  
    document.getElementById('filters')!.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.type === 'checkbox') {
            this.selectedCategory = target.checked
                ? [...this.selectedCategory, target.value]
                : this.selectedCategory.filter(cat => cat !== target.value);
             this.renderItems();
        }});
    }
}
  
  // Jalankan aplikasi
  new DataManager();