type ToDo = {
    id: number;
    activity: string;
    createdAt: string;
}

let actList: ToDo[] = [];
const actListItem = new Map<number, HTMLElement>();

const ToDoListProject = {
    isEditing: false,
    currentId: null as number | null,

    init(): void {
        const storedActs = localStorage.getItem("list-act");
        if (storedActs) {
            actList = JSON.parse(storedActs).map((act: any) => ({
                ...act,
                createdAt: new Date(act.createdAt)
            }));
            actList.forEach(act => this.showAct(act));
        }
    },

    addAct(): void {
        const toDoInput = document.getElementById("todo-name") as HTMLInputElement;
        const inputValue = toDoInput.value.trim();

        // Validasi input
        if (!inputValue) {
            this.showModal("Input tidak boleh kosong");
            return;
        }

        // Mode edit
        if (this.isEditing && this.currentId !== null) {
            const index = actList.findIndex(act => act.id === this.currentId);
            if (index > -1) {
                // Update data
                actList[index].activity = inputValue;
                
                // Update DOM
                const listComponent = actListItem.get(this.currentId);
                if (listComponent) {
                    listComponent.querySelector('.activity-text')!.textContent = inputValue;
                }
                
                this.exitEditMode();
            }
        } else { // Mode tambah
            // Cek duplikasi
            if (actList.some(act => act.activity === inputValue)) {
                this.showModal("Aktivitas sudah ada");
                return;
            }

            const currentDate = new Date();

            // Buat objek baru
            const newAct: ToDo = {
                id: Date.now(),
                activity: inputValue,
                createdAt: currentDate.toISOString().slice(0,10)
            };

            actList.push(newAct);
            this.showAct(newAct);
        }

        // Update storage dan reset input
        this.syncLocalStorage();
        toDoInput.value = '';
    },

    showAct(act: ToDo): void {
        const toDoList = document.querySelector(".todo-list")!;
        const listComponent = document.createElement("div");
        
        listComponent.className = "list-component";
        listComponent.innerHTML = `
            <div class="activity-text">${act.activity}</div>
            <div>${act.createdAt}</div>
            <div>
                <button class="edit-list">Edit</button>
                <button class="delete-list">Hapus</button>
            </div>
        `;

        toDoList.appendChild(listComponent);
        actListItem.set(act.id, listComponent);

        // Event listeners untuk tombol
        listComponent.querySelector('.edit-list')!.addEventListener('click', () => this.selectAct(act.id));
        listComponent.querySelector('.delete-list')!.addEventListener('click', () => this.deleteAct(act.id));
    },

    selectAct(id: number): void {
        const act = actList.find(act => act.id === id);
        if (!act) return;

        const toDoInput = document.getElementById("todo-name") as HTMLInputElement;
        toDoInput.value = act.activity;
        
        // Masuk mode edit
        this.isEditing = true;
        this.currentId = id;
        document.querySelector('.submit-btn')!.textContent = 'Simpan Perubahan';
    },

    deleteAct(id: number): void {
        const index = actList.findIndex(act => act.id === id);
        if (index === -1) return;

        actList.splice(index, 1);
        actListItem.get(id)?.remove();
        actListItem.delete(id);
        this.syncLocalStorage();
    },

    deleteAll(): void {
        actList = [];
        actListItem.forEach(component => component.remove());
        actListItem.clear();
        localStorage.removeItem("list-act");
    },

    // Fitur bantuan
    syncLocalStorage(): void {
        localStorage.setItem("list-act", JSON.stringify(actList));
    },

    exitEditMode(): void {
        this.isEditing = false;
        this.currentId = null;
        document.querySelector('.submit-btn')!.textContent = 'Tambah Aktivitas';
    },

    showModal(message: string): void {
        const modal = document.createElement("div");
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal">
                <p>${message}</p>
                <button class="close-modal">Tutup</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.querySelector('.close-modal')!.addEventListener('click', () => modal.remove());
    }
};

// Inisialisasi aplikasi
document.addEventListener("DOMContentLoaded", () => {
    ToDoListProject.init();
    
    // Tambahkan event listener ke form bukan button
    const todoForm = document.querySelector('#todo-form') as HTMLFormElement;
    todoForm.addEventListener('submit', (event) => {
        event.preventDefault(); 
        ToDoListProject.addAct();
    });

    document.querySelector('.delete-all')!.addEventListener('click', (event) => {
        event.preventDefault(); 
        if (actList.length > 0) {
            ToDoListProject.deleteAll();
            ToDoListProject.showModal("Semua aktivitas telah dihapus");
        } else {
            ToDoListProject.showModal("Kamu belum membuat aktivitas apapun");
        }
    });
});