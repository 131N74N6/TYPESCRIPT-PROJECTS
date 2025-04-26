import DataStorage from "./storage.js";
import { UserInfo } from "./type.js";

class UserManagement extends DataStorage<UserInfo> {
    private abortCtrl: AbortController;
    selectedId: number | null = null;
    inputName: HTMLInputElement;
    hobbies: NodeListOf<HTMLInputElement>;
    submitBtn: HTMLButtonElement;
    dataForm: HTMLFormElement;
    dataList: HTMLElement;
    searchForm: HTMLFormElement;
    searchInput: HTMLInputElement;
    notification: HTMLElement; 
    notificationMessage: HTMLElement;

    constructor(
        inputName: HTMLInputElement, hobbies: NodeListOf<HTMLInputElement>, submitBtn: HTMLButtonElement, 
        dataForm: HTMLFormElement, dataList: HTMLElement, searchForm: HTMLFormElement, searchInput: HTMLInputElement,
        notification: HTMLElement, notificationMessage: HTMLElement
    ) {
        super("user-data");
        this.abortCtrl = new AbortController();
        this.inputName = inputName
        this.hobbies = hobbies;
        this.submitBtn = submitBtn;
        this.dataForm = dataForm;
        this.dataList = dataList;
        this.searchForm = searchForm;
        this.searchInput = searchInput;
        this.notification = notification;
        this.notificationMessage = notificationMessage;
        this.setupGlobalListeners();
    }

    private setupGlobalListeners() {
        const { signal } = this.abortCtrl;
        this.dataList.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const userId = Number(target.closest('.user-list')?.getAttribute('data-id'));
            
            if(target.classList.contains('delete-btn')) this.deleteUser(userId);
            if(target.classList.contains('edit-btn')) this.handleEdit(userId);
        }, { signal });
    }

    showAllData(): void {
        const fragment = document.createDocumentFragment();
        this.getAllData().forEach(dt => {
            const element = this.createUserElement(dt);
            fragment.appendChild(element);
        });
        
        this.dataList.innerHTML = '';
        this.dataList.appendChild(fragment);
    }

    createUserElement(info: UserInfo): HTMLElement {
        const listWrapper = document.createElement("div");
        listWrapper.className = "user-list";
        listWrapper.setAttribute('data-id', String(info.id));
        listWrapper.innerHTML = `
            <div>Nama: ${info.name}</div>
            <div>Gender: ${info.gender}</div>
            <div>Hobi: ${info.hobbies.join(', ')}</div>
            <div class="user-control">
                <button type="button" class="edit-btn">Edit</button>
                <button type="button" class="delete-btn">Delete</button>
            </div>
        `;
        return listWrapper;
    }

    searchedData(filteredData: UserInfo[]): void {
        const filterFragment = document.createDocumentFragment();

        filteredData.forEach(data => {
            const filteredElement = this.createUserElement(data);
            filterFragment.appendChild(filteredElement);
        });

        this.dataList.innerHTML = '';
        this.dataList.appendChild(filterFragment);
    }

    private handleEdit(id: number): void {
        const user = this.getAllData().find(u => u.id === id);
        
        if(!user) return;

        this.selectedId = id;
        this.submitBtn.textContent = "Edit Data";
        this.dataForm.style.display = "block";

        this.inputName.value = user.name;
        document.querySelector<HTMLInputElement>(`input[value="${user.gender}"]`)!.checked = true;
        this.hobbies.forEach(hobby => {
            hobby.checked = user.hobbies.includes(hobby.value);
        });
    }

    editUser(id: number, user: UserInfo): void {
        const data = this.getAllData();
        const index = data.findIndex(dt => dt.id === id);

        data[index] = user;
        this.saveToStorage(data);
    }

    private deleteUser(id: number): void {
        const element = this.dataList.querySelector(`[data-id="${id}"]`) as HTMLElement;
        element.remove();
        this.deleteData(id);
    }

    deleteAllUser(): void {
        const data = this.getAllData();
        if (data.length > 0) {
            this.deleteAllData();
            this.showAllData();
        } else {
            this.showModal("Tambahkan data terlebih dahulu!")
        }
    }

    showForm(): void {
        this.dataForm.style.display = "block";
        this.searchForm.style.display = "none";
    }

    hideForm(): void {
        this.dataForm.style.display = "none";
        this.dataForm.reset();
        this.submitBtn.textContent = "Add Data";
        this.selectedId = null;
    }

    showSearchFilter(): void {
        this.searchForm.style.display = "block";
        this.dataForm.style.display = "none";
    }

    hideSearchFilter(): void {
        this.searchForm.style.display = "none";
        this.showAllData();
        this.searchForm.reset();
    }

    showModal(text: string) {
        this.notification.style.display = "block"
        this.notificationMessage.textContent = text;
    }

    hideModal(): void {
        this.notification.style.display = "none";
    }

    cleanUp(): void {
        this.abortCtrl.abort();
    }
}

export default UserManagement;