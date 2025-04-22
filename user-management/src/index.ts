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

document.addEventListener("DOMContentLoaded", (event): void => {
    event.preventDefault();

    const userManagement = new UserManagement(inputName, hobbies, submitBtn, dataForm, dataList, searchForm, searchInput, notification, notificationMessage);
    userManagement.showAllData();

    const darkTheme = new ThemeChanger("dark-mode", "dark-mode");

    toggleTheme.checked = darkTheme.isActive;

    const handleThemeChange = debounce((isChecked: boolean) => {
        darkTheme.changeTheme(isChecked ? 'active' : 'inactive');
        darkTheme.changeIcon(isChecked ? "☀️" : "🌙");
    }, 100);

    document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;

        if (target.closest("#searchMode")) {
            userManagement.showSearchFilter();
        } else if (target.closest("#addDataMode")) { 
            userManagement.showForm();
        } else if (target.closest("#delete-all")) {
            userManagement.deleteAllUser();
        } else if (target.closest("#closeForm")) {
            userManagement.hideForm();
        } else if (target.closest("#closeFilter")) {
            userManagement.hideSearchFilter();
        } else if (target.closest("#hide-message")) {
            userManagement.hideModal();
        }
    });

    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const userData = userManagement.getAllData();

        if (!searchInput.value.trim()) {
            userManagement.showModal("Masukkan nama yang ingin dicari!");
            return;
        }

        const searched = searchInput.value.toLowerCase();
        const filterData = userData.filter(user => user.name.toLowerCase().includes(searched));
        userManagement.searchedData(filterData);
    });

    dataForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const userData = userManagement.getAllData();
        const smallText = inputName.value.toLowerCase();
        const isExist = userData.some(user => user.name.toLowerCase().includes(smallText));
        
        const selectedGender = document.querySelector<HTMLInputElement>(
            'input[name="gender"]:checked'
        )?.value as Gender;
        
        const selectedHobbies = Array.from(
            document.querySelectorAll<HTMLInputElement>('input[name="hobbies"]:checked')
        ).map(hobby => hobby.value);
    
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
    });

    toggleTheme.addEventListener("change", (event) => {
        handleThemeChange((event.target as HTMLInputElement).checked);
    });
});