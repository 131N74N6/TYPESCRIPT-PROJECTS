import { Gender, UserInfo } from "./type.js";
import ThemeChanger from "./theme.js";
import DataStorage from "./storage.js";
import Modal from "./modal.js";

const inputName = document.getElementById("name") as HTMLInputElement;
const searchInput = document.getElementById("searched-name") as HTMLInputElement;
const hobbies = document.querySelectorAll('input[name="hobbies"]') as NodeListOf<HTMLInputElement>;

const dataList = document.getElementById("data-list") as HTMLElement;
const dataForm = document.getElementById("dataForm") as HTMLFormElement;
const searchForm = document.getElementById("searchForm") as HTMLFormElement;

const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const toggleTheme = document.getElementById("dark-mode") as HTMLInputElement;

let userManagement : UserManagement;

class UserManagement extends DataStorage<UserInfo> {
    private controller: AbortController;
    private darkTheme = new ThemeChanger("dark-mode", "dark-mode");

    private handleDarkTheme = this.darkTheme.debounce((isActived: boolean) => {
        this.darkTheme.changeTheme(isActived ? "active" : "inactive");
        this.darkTheme.changeIcon(isActived ? "☀️" : "🌙");
    }, 100);

    constructor() {
        super("user-data");
        this.controller = new AbortController();
        this.setupGlobalListeners();
        toggleTheme.checked = this.darkTheme.isActive;
    }

    private setupGlobalListeners() {
        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const getAllUserData = Array.from(document.querySelectorAll(".user-list"));
            
            const selectButton = target.closest(".edit-btn");
            const deleteButton = target.closest(".delete-btn");

            const selectUserData = selectButton?.closest(".user-list");
            const deleteUserData = deleteButton?.closest(".user-list");

            const getSelectedIndex = getAllUserData.indexOf(selectUserData as Element);
            const getIndexToRemove = getAllUserData.indexOf(deleteUserData as Element);

            if (getSelectedIndex > -1) {
                const userData = this.getAllData()[getSelectedIndex];
                this.handleEdit(userData.id);
            }
            if (getIndexToRemove > -1) {
                const userData = this.getAllData()[getIndexToRemove]; 
                this.deleteUser(userData.id);
            }
            if (target.closest("#searchMode")) this.showSearchFilter();
            if (target.closest("#addDataMode")) this.showForm();
            if (target.closest("#delete-all")) this.deleteAllUser();
            if (target.closest("#closeForm")) this.hideForm();
            if (target.closest("#closeFilter")) this.hideSearchFilter();
        }, { signal: this.controller.signal });

        dataForm.addEventListener("submit", (event) => this.handleForm(event), { 
            signal: this.controller.signal 
        });

        searchForm.addEventListener("submit", (event) => this.handleSearch(event), { 
            signal: this.controller.signal 
        });

        toggleTheme.addEventListener("change", (event) => this.handleToggle(event), { 
            signal: this.controller.signal 
        });
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
            new Modal("Isi semua field!");
            return;
        }

        const newUser: Partial<UserInfo> = {
            name: inputName.value,
            gender: selectedGender,
            hobbies: selectedHobbies
        }
    
        if (isInEditMode) {
            this.changeData(this.selectedId as number, newUser);
        } else {
            if (!isExist) {
                this.add(newUser as Omit<UserInfo, 'id'>);
                new Modal("Data berhasil ditambahkan");
            } else {
                new Modal("Data sudah ada! Masukkan data lain!");
                this.resetForm();
            }
        }
    
        this.showAllData();
        this.resetForm();
    }

    private resetForm(): void {
        dataForm.reset();
        this.showAllData();
        dataForm.style.display = "none";
        this.selectedId = null;
    }

    showAllData(): void {
        const fragment = document.createDocumentFragment();

        if (this.getAllData().length > 1) {
            this.getAllData().forEach(dt => {
                const element = this.createUserElement(dt);
                fragment.appendChild(element);
            });
        } else {
            const empty = document.createElement("div") as HTMLDivElement;
            empty.className = "empty-list";
            
            const message = document.createElement("div");
            message.className = "message";
            message.textContent = "....Daftar aktifitas kosong....";
    
            empty.appendChild(message);
            fragment.appendChild(empty);
        }
        
        dataList.innerHTML = '';
        dataList.appendChild(fragment);
    }

    private createUserElement(info: UserInfo): HTMLElement {
        const listWrapper = document.createElement("div");
        listWrapper.className = "user-list";

        const nama = document.createElement("div") as HTMLDivElement;
        nama.textContent = `Nama: ${info.name}`;

        const gender = document.createElement("div") as HTMLDivElement;
        gender.textContent = `Gender: ${info.gender}`;

        const hobbies = document.createElement("div") as HTMLDivElement;
        hobbies.textContent = `Hobi: ${info.hobbies.join(', ')}`;

        const buttonWrap = document.createElement("div") as HTMLDivElement;
        buttonWrap.className = "button-wrap";

        const editBtn = document.createElement("button") as HTMLButtonElement;
        editBtn.className = "edit-btn";
        editBtn.textContent = "Edit";
        editBtn.type = "button";

        const deleteBtn = document.createElement("button") as HTMLButtonElement;
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.type = "button";

        buttonWrap.append(editBtn, deleteBtn);
        listWrapper.append(nama, gender, hobbies, buttonWrap);

        return listWrapper;
    }
    
    private handleSearch(event: SubmitEvent): void {
        event.preventDefault();
        const userData = this.getAllData();

        if (!searchInput.value.trim()) {
            new Modal("Masukkan nama yang ingin dicari!");
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
        this.deleteData(id);

        if (this.getSelectedId() === id) this.resetForm();

        this.showAllData();
    }

    private deleteAllUser(): void {
        const data = this.getAllData();
        
        if (data.length > 0) {
            this.deleteAllData();
            dataList.replaceChildren();
            this.resetForm();
        } else {
            new Modal("Tambahkan data terlebih dahulu!")
        }
        this.showAllData();
    }

    handleToggle(event: Event): void {
        this.handleDarkTheme((event.target as HTMLInputElement).checked);
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

    cleanUp(): void {
        this.controller.abort();
    }
}

const init = (): void => {
    userManagement = new UserManagement();
    userManagement.showAllData();
}

const cleanUp = (): void => {
    userManagement.cleanUp();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", cleanUp);