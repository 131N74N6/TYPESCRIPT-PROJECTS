import { debounce, ThemeChanger } from "./theme.js";
import { Gender, UserInfo } from "./type.js";
import UserManagement from "./user.js";

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
let abortController : AbortController;
let darkTheme : ThemeChanger;

const setupServices = (): void => {
    userManagement = new UserManagement(
        inputName, hobbies, submitBtn, dataForm, dataList, 
        searchForm, searchInput, notification, notificationMessage
    );
    darkTheme = new ThemeChanger("dark-mode", "dark-mode");
}

const setupDataAndTheme = (): void => {
    toggleTheme.checked = darkTheme.isActive;
    userManagement.showAllData();
}

const setupEventListeners = (): void => {
    abortController = new AbortController();
    const { signal } = abortController;

    document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        if (target.closest("#searchMode")) userManagement.showSearchFilter();
        if (target.closest("#addDataMode")) userManagement.showForm();
        if (target.closest("#delete-all")) userManagement.deleteAllUser();
        if (target.closest("#closeForm")) userManagement.hideForm();
        if (target.closest("#closeFilter")) userManagement.hideSearchFilter();
        if (target.closest("#hide-message")) userManagement.hideModal();
    }, { signal });

    dataForm.addEventListener("submit", handleForm, { signal });
    searchForm.addEventListener("submit", handleSearch, { signal });
    toggleTheme.addEventListener("change", handleThemeToggle, { signal });
}

const handleThemeChange = debounce((isChecked: boolean): void => {
    darkTheme.changeTheme(isChecked ? 'active' : 'inactive');
    darkTheme.changeIcon(isChecked ? "☀️" : "🌙");
}, 100);

const handleThemeToggle = (event: Event): void => {
    handleThemeChange((event.target as HTMLInputElement).checked);
}

const handleForm = (event: SubmitEvent): void => {
    event.preventDefault();

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
        userManagement.showModal("Isi semua field!");
        return;
    }

    if (userManagement.selectedId) {
        const updatedUser: UserInfo = {
            id: userManagement.selectedId,
            name: inputName.value,
            gender: selectedGender,
            hobbies: selectedHobbies
        }
        
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
            }
            
            dataList.appendChild(userManagement.createUserElement(newUser));
            userManagement.add(newUser);
            userManagement.showModal("Data berhasil ditambahkan");
        } else {
            userManagement.showModal("Data sudah ada! Masukkan data lain!");
        }
    }

    dataForm.reset();
    dataForm.style.display = "none";
    userManagement.selectedId = null;
}

const handleSearch = (event: SubmitEvent): void => {
    event.preventDefault();
    const userData = userManagement.getAllData();

    if (!searchInput.value.trim()) {
        userManagement.showModal("Masukkan nama yang ingin dicari!");
        return;
    }

    const searched = searchInput.value.toLowerCase();
    const filterData = userData.filter(user => user.name.toLowerCase().includes(searched));
    userManagement.searchedData(filterData);
}

const init = (): void => {
    setupServices();
    setupDataAndTheme();
    setupEventListeners();
}

const cleanUp = (): void => {
    abortController?.abort();
    userManagement.cleanUp();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", cleanUp);