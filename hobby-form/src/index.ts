interface UserInfo {
    id: number;
    name: string;
    gender: 'Laki-laki' | 'Perempuan'[];
    hobbies: string[];
}

class DataStorage<A extends { id: number }>{
    private key: string;

    constructor(storageKey: string) {
        this.key = storageKey;
    }

    private getDataFromStorage(): A[] {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    }

    private saveToStorage(data: A[]): void {
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

const inputName = document.getElementById("name") as HTMLInputElement;
const gender = document.querySelectorAll('input[name="gender"]') as NodeListOf<HTMLInputElement>;
const hobbies = document.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;

const selectedHobbies = Array.from(hobbies).filter(hobby => hobby.checked).map(hobby => hobby.value);
const selectedGender = Array.from(gender).filter(gd => gd.checked).map(gd => gd.value);

class UserManagement extends DataStorage<UserInfo>{
    private userMap = new Map<number, HTMLElement>();
    selectedId: number | null = null;

    constructor() {
        super("user-data");
    }

    showAllData(): void {
        const data = this.getAllData();
        data.forEach(dt => this.showUserData(dt));
    }

    showUserData(info: UserInfo): void {
        const dataList = document.getElementById("data-list") as HTMLElement;
        const listWrapper = document.createElement("div");
        listWrapper.className = "user-list";
        listWrapper.innerHTML = `
            <div>${info.name}</div>
            <div>${info.gender}</div>
            <div>${info.hobbies}</div>
            <div class="user-control">
                <button type="button" class="edit-btn">Edit</button>
                <button type="button" class="delete-btn">Delete</button>
            </div>
        `;
        dataList.appendChild(listWrapper);
        this.userMap.set(info.id, listWrapper);

        const deleteBtn = listWrapper.querySelector(".delete-btn") as HTMLButtonElement;
        const editBtn = listWrapper.querySelector(".edit-btn") as HTMLButtonElement;

        if (deleteBtn) deleteBtn.addEventListener("click", (): void => {
            const userSign = this.userMap.get(info.id);

            if (userSign) {
                userSign.remove();
                this.userMap.delete(info.id);
                this.deleteData(info.id);
            }
        });

        if (editBtn) editBtn.addEventListener("click", (): void => {
            this.selectedId = info.id;

            inputName.value = info.name;
            gender;
            hobbies;
        });
    }

    deleteAllUser(): void {
        const data = this.getAllData();
        if (data.length > 0) {
            this.deleteAllData();
            this.userMap.forEach(data => data.remove());
            this.userMap.clear();
        } else {
            console.log("data masih kosong");
        }
    }

    showForm(): void {
        const dataForm = document.getElementById("dataForm") as HTMLFormElement;
        dataForm.style.display = "block";
    }

    hideForm(): void {
        const dataForm = document.getElementById("dataForm") as HTMLFormElement;
        dataForm.style.display = "none";
    }

    showSearchFilter(): void {
        const searchForm = document.getElementById("searchForm") as HTMLFormElement;
        searchForm.style.display = "block";
    }

    hideSearchFilter(): void {
        const searchForm = document.getElementById("searchForm") as HTMLFormElement;
        searchForm.style.display = "none";
    }
}

class ThemeChanger {
    private key: string;
    private attrTheme: string;
    private currentState: 'active' | 'inactive';

    constructor(themeKey: string, attribute: string) {
        this.key = themeKey;
        this.attrTheme = attribute;
        this.currentState = (localStorage.getItem(this.key) as 'active' | 'inactive') || 'inactive';
        this.applyTheme();
    }

    applyTheme(): void {
        localStorage.setItem(this.key, this.currentState);
        document.body.setAttribute(this.attrTheme, this.currentState);
    }

    changeTheme(): void {}
}

document.addEventListener("DOMContentLoaded", (event): void => {
    event.preventDefault();
    const userManagement = new UserManagement();

    const dataForm = document.getElementById("dataForm") as HTMLFormElement;
    const searchForm = document.getElementById("searchForm") as HTMLFormElement;

    const searchMode = document.getElementById("searchMode") as HTMLButtonElement;
    const addDataMode = document.getElementById("addDataMode") as HTMLButtonElement;

    const closeForm = document.getElementById("closeForm") as HTMLButtonElement;
    const closeFilter = document.getElementById("closeFilter") as HTMLButtonElement;
    
    userManagement.showAllData();
    if (searchMode) searchMode.addEventListener("click", (): void => userManagement.showSearchFilter());
    if (addDataMode) addDataMode.addEventListener("click", (): void => userManagement.showForm());
    if (closeForm) closeForm.addEventListener("click", (): void => userManagement.hideForm());
    if (closeFilter) closeFilter.addEventListener("click", (): void => userManagement.hideSearchFilter());

    dataForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (userManagement.selectedId) {
        } else {
            const newUser: UserInfo = {
                id: Date.now(),
                name: inputName.value,
                gender: selectedGender,
                hobbies: selectedHobbies
            }
            userManagement.add(newUser);
            userManagement.showUserData(newUser);
        }
    });
});