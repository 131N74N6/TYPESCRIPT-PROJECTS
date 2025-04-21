import { debounce, ThemeChanger } from "./theme.js";
import DataStorage from "./storage.js";

enum Gender {
    Male = "Laki-laki",
    Female = "Perempuan"
}

interface UserInfo {
    id: number;
    name: string;
    gender: Gender;
    hobbies: string[];
}

const inputName = document.getElementById("name") as HTMLInputElement;
const searchInput = document.getElementById("searched-name") as HTMLInputElement;
const hobbies = document.querySelectorAll('input[name="hobbies"]') as NodeListOf<HTMLInputElement>;

const dataList = document.getElementById("data-list") as HTMLElement;
const dataForm = document.getElementById("dataForm") as HTMLFormElement;
const searchForm = document.getElementById("searchForm") as HTMLFormElement;

const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const iconTheme = document.querySelector('[for="dark-mode"]') as HTMLLabelElement;
const toggleTheme = document.getElementById("dark-mode") as HTMLInputElement;

const notification = document.getElementById("notification") as HTMLElement;
const notificationMessage = document.getElementById("notification-message") as HTMLElement;

class UserManagement extends DataStorage<UserInfo>{
    private userMap = new Map<number, HTMLElement>();
    selectedId: number | null = null;

    constructor() {
        super("user-data");
        this.setupGlobalListeners();
    }

    private setupGlobalListeners() {
        dataList.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const userId = Number(target.closest('.user-list')?.getAttribute('data-id'));
            
            if(target.classList.contains('delete-btn')) {
                this.deleteUser(userId);
            } 
            else if(target.classList.contains('edit-btn')) {
                this.handleEdit(userId);
            }
        });
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

        dataList.innerHTML = '';
        dataList.appendChild(filterFragment);
    }

    private handleEdit(id: number): void {
        const user = this.getAllData().find(u => u.id === id);
        if(!user) return;

        this.selectedId = id;
        submitBtn.textContent = "Edit Data";
        dataForm.style.display = "block";

        // Set form values
        inputName.value = user.name;
        document.querySelector<HTMLInputElement>(`input[value="${user.gender}"]`)!.checked = true;
        hobbies.forEach(hobby => {
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
        const element = dataList.querySelector(`[data-id="${id}"]`) as HTMLElement;
        element.remove();
        this.deleteData(id);
    }

    deleteAllUser(): void {
        const data = this.getAllData();
        if (data.length > 0) {
            this.deleteAllData();

        } else {
            this.showModal("Tambahkan data terlebih dahulu!")
        }
    }

    showForm(): void {
        const dataForm = document.getElementById("dataForm") as HTMLFormElement;
        dataForm.style.display = "block";
        searchForm.style.display = "none";
    }

    hideForm(): void {
        const dataForm = document.getElementById("dataForm") as HTMLFormElement;
        dataForm.style.display = "none";
        dataForm.reset();
    }

    showSearchFilter(): void {
        const searchForm = document.getElementById("searchForm") as HTMLFormElement;
        searchForm.style.display = "block";
        dataForm.style.display = "none";
    }

    hideSearchFilter(): void {
        searchForm.style.display = "none";
        this.showAllData();
        searchForm.reset();
    }

    showModal(text: string) {
        notificationMessage.textContent = text;
    }

    hideModal(): void {
        setTimeout(() => notification.style.display = "none", 3000);
    }
}

document.addEventListener("DOMContentLoaded", (event): void => {
    event.preventDefault();
    const userManagement = new UserManagement();
    userManagement.showAllData();
    const darkTheme = new ThemeChanger("dark-mode", "dark-mode");

    toggleTheme.checked = darkTheme.isActive;

    const handleThemeChange = debounce((isChecked: boolean) => {
        darkTheme.changeTheme(isChecked ? 'active' : 'inactive');
        iconTheme.textContent = toggleTheme.checked ? "☀️" : "🌙";
    }, 100);

    const searchMode = document.getElementById("searchMode") as HTMLButtonElement;
    const addDataMode = document.getElementById("addDataMode") as HTMLButtonElement;
    const deleteAll = document.getElementById("delete-all") as HTMLButtonElement;

    const closeForm = document.getElementById("closeForm") as HTMLButtonElement;
    const closeFilter = document.getElementById("closeFilter") as HTMLButtonElement;
    
    if (deleteAll) deleteAll.addEventListener("click", (): void => userManagement.deleteAllData());
    if (searchMode) searchMode.addEventListener("click", (): void => userManagement.showSearchFilter());
    if (addDataMode) addDataMode.addEventListener("click", (): void => userManagement.showForm());
    if (closeForm) closeForm.addEventListener("click", (): void => userManagement.hideForm());
    if (closeFilter) closeFilter.addEventListener("click", (): void => userManagement.hideSearchFilter());

    const userData = userManagement.getAllData();
    const smallText = inputName.value.toLowerCase();
    const isExist = userData.some(user => user.name.toLowerCase().includes(smallText));

    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const userData = userManagement.getAllData();

        if (!searchInput.value.trim()) {
            userManagement.showModal("Masukkan nama yang ingin dicari!");
            userManagement.hideModal();
            return;
        }

        if (!isExist) {
            userManagement.showModal(`${smallText} tidak ada atau sudah dihapus`);
            userManagement.hideModal();
            return;
        }

        const searched = searchInput.value.toLowerCase();
        const filterData = userData.filter(user => user.name.toLowerCase().includes(searched));
        userManagement.searchedData(filterData);
    });

    dataForm.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const selectedGender = document.querySelector<HTMLInputElement>(
            'input[name="gender"]:checked'
        )?.value as Gender;
        
        const selectedHobbies = Array.from(
            document.querySelectorAll<HTMLInputElement>('input[name="hobbies"]:checked')
        ).map(hobby => hobby.value);
    
        if (!inputName.value.trim() || !selectedGender || selectedHobbies.length === 0) {
            userManagement.showModal("Isi semua field!");
            userManagement.hideModal();
            return;
        }
    
        if (userManagement.selectedId) {
            const updatedUser: UserInfo = {
                id: userManagement.selectedId,
                name: inputName.value,
                gender: selectedGender,
                hobbies: selectedHobbies
            };
            
            // Update DOM langsung tanpa re-render semua
            const existingElement = dataList.querySelector(`[data-id="${updatedUser.id}"]`);
            if(existingElement) {
                existingElement.innerHTML = userManagement.createUserElement(updatedUser).innerHTML;
            }
            
            userManagement.editUser(updatedUser.id, updatedUser);
        } else {
            if (!isExist) {
                const newUser: UserInfo = {
                    id: Date.now(),
                    name: inputName.value,
                    gender: selectedGender,
                    hobbies: selectedHobbies
                };
                
                dataList.appendChild(userManagement.createUserElement(newUser));
                userManagement.add(newUser);
                userManagement.showModal("Data berhasil ditambahkan");
                userManagement.hideModal();
            } else {
                userManagement.showModal("Data sudah ada! Masukkan data lain!");
                userManagement.hideModal();
            }
        }
    
        dataForm.reset();
        dataForm.style.display = "none";
        userManagement.selectedId = null;
    });

    toggleTheme.addEventListener("change", (event) => {
        handleThemeChange((event.target as HTMLInputElement).checked);
    });
});