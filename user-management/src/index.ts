import { debounce, ThemeChanger } from "./theme.js";
import { Gender, UserInfo } from "./type.js";
import DataStorage from "./storage.js";

const inputName = document.getElementById("name") as HTMLInputElement;
const searchInput = document.getElementById("searched-name") as HTMLInputElement;
const hobbies = document.querySelectorAll('input[name="hobbies"]') as NodeListOf<HTMLInputElement>;

const dataList = document.getElementById("data-list") as HTMLElement;
const dataForm = document.getElementById("dataForm") as HTMLFormElement;
const searchForm = document.getElementById("searchForm") as HTMLFormElement;

const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const toggleTheme = document.getElementById("dark-mode") as HTMLInputElement;

const notification = document.getElementById("notification") as HTMLElement;
const notificationMessage = document.getElementById("notification-message") as HTMLElement;

let userManagement : UserManagement;
let darkTheme : ThemeChanger;

class UserManagement extends DataStorage<UserInfo> {
    private abortCtrl: AbortController;

    constructor() {
        super("user-data");
        this.abortCtrl = new AbortController();
        this.setupGlobalListeners();
    }

    private setupGlobalListeners() {
        const { signal } = this.abortCtrl;

        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const userId = Number(target.closest('.user-list')?.getAttribute('data-id'));
            
            if(target.classList.contains('delete-btn')) this.deleteUser(userId);
            if(target.classList.contains('edit-btn')) this.handleEdit(userId);

            if (target.closest("#searchMode")) this.showSearchFilter();
            if (target.closest("#addDataMode")) this.showForm();
            if (target.closest("#delete-all")) this.deleteAllUser();
            if (target.closest("#closeForm")) this.hideForm();
            if (target.closest("#closeFilter")) this.hideSearchFilter();
            if (target.closest("#hide-message")) this.hideModal();
        }, { signal });

        dataForm.addEventListener("submit", (event) => this.handleForm(event), { signal });
        searchForm.addEventListener("submit", (event) => this.handleSearch(event), { signal })
    }

    private handleForm(event: SubmitEvent): void {
        event.preventDefault();
        const isInEditMode = !!this.getSelectedId();
    
        const selectedGender = document.querySelector<HTMLInputElement>(
            'input[name="gender"]:checked'
        )?.value as Gender;
        
        const selectedHobbies = Array.from(
            document.querySelectorAll<HTMLInputElement>('input[name="hobbies"]:checked')
        ).map(hobby => hobby.value);
    
        const userData = userManagement.getAllData();
        const smallText = inputName.value.toLowerCase();
        const isExist = userData.some(user => user.name.toLowerCase().includes(smallText));
    
        if (!inputName.value.trim() || !selectedGender || selectedHobbies.length === 0) {
            this.showModal("Isi semua field!");
            return;
        }

        const newUser: Omit<UserInfo, 'id'> = {
            name: inputName.value,
            gender: selectedGender,
            hobbies: selectedHobbies
        }
    
        if (isInEditMode) {
            this.changeData(this.getSelectedId() as number, newUser);
        } else {
            if (!isExist) {
                this.add(newUser);
                this.showModal("Data berhasil ditambahkan");
            } else {
                this.showModal("Data sudah ada! Masukkan data lain!");
            }
        }
    
        dataForm.reset();
        this.showAllData();
        dataForm.style.display = "none";
        this.selectedId = null;
    }

    showAllData(): void {
        const fragment = document.createDocumentFragment();

        this.getAllData().forEach(dt => {
            const element = this.createUserElement(dt);
            fragment.appendChild(element);
        });
        
        dataList.innerHTML = '';
        dataList.appendChild(fragment);
    }

    private createUserElement(info: UserInfo): HTMLElement {
        const listWrapper = document.createElement("div");
        listWrapper.className = "user-list";
        listWrapper.setAttribute('data-id', String(info.id));

        const nama = document.createElement("div") as HTMLDivElement;
        nama.textContent = info.name;

        const gender = document.createElement("div") as HTMLDivElement;
        gender.textContent = info.gender;

        const hobbies = document.createElement("div") as HTMLDivElement;
        hobbies.textContent = info.hobbies.join(', ');

        const buttonWrap = document.createElement("div") as HTMLDivElement;
        buttonWrap.className = "button-wrap";

        const editBtn = document.createElement("button") as HTMLButtonElement;
        editBtn.className = "edit-btn";
        editBtn.textContent = "Edit";

        const deleteBtn = document.createElement("button") as HTMLButtonElement;
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";

        buttonWrap.append(editBtn, deleteBtn);
        listWrapper.append(nama, gender, hobbies, buttonWrap);

        return listWrapper;
    }
    
    private handleSearch(event: SubmitEvent): void {
        event.preventDefault();
        const userData = this.getAllData();

        if (!searchInput.value.trim()) {
            this.showModal("Masukkan nama yang ingin dicari!");
            return;
        }

        const searched = searchInput.value.toLowerCase();
        const filterData = userData.filter(user => user.name.toLowerCase().includes(searched));
        userManagement.searchedData(filterData);
    }

    searchedData(filteredData: UserInfo[]): void {
        const filterFragment = document.createDocumentFragment();

        filteredData.forEach(data => {
            const filteredElement = this.createUserElement(data);
            filterFragment.appendChild(filteredElement);
        });

        dataList.innerHTML = '';
        dataList.appendChild(filterFragment);
    }

    private handleEdit(id: number): void {
        const user = this.getAllData().find(u => u.id === id);
        
        if(!user) return;

        this.selectedId = id;
        submitBtn.textContent = "Edit Data";
        dataForm.style.display = "block";

        inputName.value = user.name;
        document.querySelector<HTMLInputElement>(`input[value="${user.gender}"]`)!.checked = true;
        hobbies.forEach(hobby => {
            hobby.checked = user.hobbies.includes(hobby.value);
        });
    }

    private deleteUser(id: number): void {
        const element = dataList.querySelector(`[data-id="${id}"]`) as HTMLElement;
        element.remove();
        this.deleteData(id);
    }

    private deleteAllUser(): void {
        const data = this.getAllData();
        if (data.length > 0) {
            this.deleteAllData();
            dataList.replaceChildren();
        } else {
            this.showModal("Tambahkan data terlebih dahulu!")
        }
    }

    showForm(): void {
        dataForm.style.display = "block";
        searchForm.style.display = "none";
    }

    hideForm(): void {
        dataForm.style.display = "none";
        dataForm.reset();
        submitBtn.textContent = "Add Data";
        this.selectedId = null;
    }

    showSearchFilter(): void {
        searchForm.style.display = "block";
        dataForm.style.display = "none";
    }

    hideSearchFilter(): void {
        searchForm.style.display = "none";
        this.showAllData();
        searchForm.reset();
    }

    showModal(text: string) {
        notification.style.display = "block"
        notificationMessage.textContent = text;
    }

    hideModal(): void {
        notification.style.display = "none";
    }

    cleanUp(): void {
        this.abortCtrl.abort();
    }
}

const setupServices = (): void => {
    userManagement = new UserManagement();
    darkTheme = new ThemeChanger("dark-mode", "dark-mode");
}

const setupDataAndTheme = (): void => {
    toggleTheme.checked = darkTheme.isActive;
    userManagement.showAllData();
}

const init = (): void => {
    setupServices();
    setupDataAndTheme();
}

const cleanUp = (): void => {
    userManagement.cleanUp();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", cleanUp);