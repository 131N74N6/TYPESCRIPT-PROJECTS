import ThemeChanger from "./theme";
import DataStorage from "./storage";
import Modal from "./modal";

const Gender = {
    Male: "Laki-laki",
    Female: "Perempuan"
} as const;

type Gender = typeof Gender[keyof typeof Gender];

interface UserInfo {
    id: string;
    name: string;
    gender: Gender;
    hobbies: string[];
}

class UserManagement extends DataStorage<UserInfo> {
    private dataForm: HTMLFormElement;
    private inputName: HTMLInputElement;
    private submitBtn: HTMLButtonElement;
    private dataList: HTMLElement;
    private searchInput: HTMLInputElement;
    private searchForm: HTMLFormElement;
    private toggleTheme: HTMLInputElement;
    private notification: Modal;
    private controller: AbortController = new AbortController();
    private darkTheme = new ThemeChanger("dark-mode", "dark-mode");
    protected selectedId: string | null = null;

    private handleDarkTheme = this.darkTheme.debounce((isActived: boolean) => {
        this.darkTheme.changeTheme(isActived ? "active" : "inactive");
        this.darkTheme.changeIcon(isActived ? "☀️" : "🌙");
    }, 100);

    constructor(
        dataForm: HTMLFormElement, inputName: HTMLInputElement, dataList: HTMLElement, 
        searchForm: HTMLFormElement, searchInput: HTMLInputElement, submitBtn: HTMLButtonElement,
        toggleTheme: HTMLInputElement, notification: HTMLElement
    ) {
        super("user and hobbies");
        this.dataForm = dataForm;
        this.inputName = inputName;
        this.dataList = dataList
        this.searchForm = searchForm;
        this.searchInput = searchInput;
        this.submitBtn = submitBtn;
        this.toggleTheme = toggleTheme;
        this.setupGlobalListeners();
        this.notification = new Modal(notification);
        toggleTheme.checked = this.darkTheme.isActive;
    }

    private setupGlobalListeners() {
        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;

            if (target.closest("#searchMode")) this.showSearchFilter();
            if (target.closest("#addDataMode")) this.showForm();
            if (target.closest("#delete-all")) this.deleteAllUser();
            if (target.closest("#closeForm")) this.hideForm();
            if (target.closest("#closeFilter")) this.hideSearchFilter();
        }, { signal: this.controller.signal });

        this.dataForm.addEventListener("submit", (event) => this.handleForm(event), { 
            signal: this.controller.signal 
        });

        this.searchForm.addEventListener("submit", (event) => this.handleSearch(event), { 
            signal: this.controller.signal 
        });

        this.toggleTheme.addEventListener("change", (event) => this.handleToggle(event), { 
            signal: this.controller.signal 
        });
    }

    private async handleForm(event: SubmitEvent): Promise<void> {
        event.preventDefault();
    
        const selectedGender = document.querySelector<HTMLInputElement>(
            'input[name="gender"]:checked'
        )?.value as Gender;
        
        const selectedHobbies = Array.from(
            document.querySelectorAll<HTMLInputElement>('input[name="hobbies"]:checked')
        ).map(hobby => hobby.value);
    
        const userData = await this.loadFromStorage();
        const smallText = this.inputName.value.toLowerCase();
        const isExist = userData.some(user => user.name.toLowerCase().includes(smallText));
    
        if (!this.inputName.value.trim() || !selectedGender || selectedHobbies.length === 0) {
            this.notification.createModal("Isi semua field!");
            return;
        }

        const newUser: Omit<UserInfo, 'id'> = {
            name: this.inputName.value,
            gender: selectedGender,
            hobbies: selectedHobbies
        }
    
        if (this.selectedId !== null) {
            this.changeData(this.selectedId as string, newUser);
        } else {
            if (!isExist) {
                this.addToStorage(newUser);

            } else {
                this.notification.createModal("Data sudah ada! Masukkan data lain!");
                this.resetForm();
            }
        }
    
        this.showAllData();
        this.resetForm();
    }

    private resetForm(): void {
        this.dataForm.reset();
        this.showAllData();
        this.dataForm.style.display = "none";
        this.selectedId = null;
    }

    async showAllData(): Promise<void> {
        const fragment = document.createDocumentFragment();
        const getAllData = await this.loadFromStorage();

        if (getAllData.length > 1) {
            getAllData.forEach(dt => {
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
        
        this.dataList.innerHTML = '';
        this.dataList.appendChild(fragment);
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
        editBtn.textContent = "Select";
        editBtn.type = "button";
        editBtn.addEventListener("click", () => this.handleEdit(info.id), {
            signal: this.controller.signal
        });

        const deleteBtn = document.createElement("button") as HTMLButtonElement;
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.type = "button";
        deleteBtn.addEventListener("click", () => this.deleteUser(info.id), {
            signal: this.controller.signal
        });

        buttonWrap.append(editBtn, deleteBtn);
        listWrapper.append(nama, gender, hobbies, buttonWrap);

        return listWrapper;
    }
    
    private async handleSearch(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const getAllData = await this.loadFromStorage();

        if (!this.searchInput.value.trim()) {
            this.notification.createModal("Masukkan nama yang ingin dicari!");
            return;
        }

        const searched = this.searchInput.value.toLowerCase();
        const filterData = getAllData.filter(user => user.name.toLowerCase().includes(searched));
        this.searchedData(filterData);
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

    private async handleEdit(id: string): Promise<void> {
        const getAllData = await this.loadFromStorage();
        const user = getAllData.find(u => u.id === id);

        if(!user) return;

        document.querySelectorAll<HTMLInputElement>('input[name="hobbies"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        user.hobbies.forEach(hobby => {
            const hobbyCheckbox = document.querySelector<HTMLInputElement>(
                `input[value="${hobby}"][name="hobbies"]`
            );
            if (hobbyCheckbox) hobbyCheckbox.checked = true;
        });

        this.selectedId = id;
        this.submitBtn.textContent = "Edit Data";
        this.dataForm.style.display = "block";

        this.inputName.value = user.name;
        document.querySelector<HTMLInputElement>(`input[value="${user.gender}"]`)!.checked = true;
    }

    private async deleteUser(id: string): Promise<void> {
        await this.deleteData(id);

        if (this.selectedId === id) this.resetForm();

        this.showAllData();
    }

    private async deleteAllUser(): Promise<void> {
        const data = await this.loadFromStorage();
        
        if (data.length > 0) {
            await this.deleteAllData();
            this.dataList.replaceChildren();
            this.resetForm();
        } else {
            this.notification.createModal("Tambahkan data terlebih dahulu!")
        }
        this.showAllData();
    }

    handleToggle(event: Event): void {
        this.handleDarkTheme((event.target as HTMLInputElement).checked);
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

    cleanUp(): void {
        this.notification.teardownModal();
        this.controller.abort();
        this.resetForm();
    }
}

export default UserManagement;