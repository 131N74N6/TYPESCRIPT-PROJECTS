"use strict";
class DataStorage {
    constructor(storageKey) {
        this.key = storageKey;
    }
    getDataFromStorage() {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    }
    saveToStorage(data) {
        localStorage.setItem(this.key, JSON.stringify(data));
    }
    deleteAllFromStorage() {
        localStorage.removeItem(this.key);
    }
    getAllData() {
        return this.getDataFromStorage();
    }
    add(info) {
        const data = this.getDataFromStorage();
        data.push(info);
        this.saveToStorage(data);
    }
    deleteData(id) {
        const data = this.getDataFromStorage();
        const index = data.findIndex(dt => dt.id === id);
        data.splice(index, 1);
        this.saveToStorage(data);
    }
    deleteAllData() {
        this.deleteAllFromStorage();
    }
}
const inputName = document.getElementById("name");
const gender = document.querySelectorAll('input[name="gender"]');
const hobbies = document.querySelectorAll('input[type="checkbox"]');
const selectedHobbies = Array.from(hobbies).filter(hobby => hobby.checked).map(hobby => hobby.value);
const selectedGender = Array.from(gender).filter(gd => gd.checked).map(gd => gd.value);
class UserManagement extends DataStorage {
    constructor() {
        super("user-data");
        this.userMap = new Map();
        this.selectedId = null;
    }
    showAllData() {
        const data = this.getAllData();
        data.forEach(dt => this.showUserData(dt));
    }
    showUserData(info) {
        const dataList = document.getElementById("data-list");
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
        const deleteBtn = listWrapper.querySelector(".delete-btn");
        const editBtn = listWrapper.querySelector(".edit-btn");
        if (deleteBtn)
            deleteBtn.addEventListener("click", () => {
                const userSign = this.userMap.get(info.id);
                if (userSign) {
                    userSign.remove();
                    this.userMap.delete(info.id);
                    this.deleteData(info.id);
                }
            });
        if (editBtn)
            editBtn.addEventListener("click", () => {
                this.selectedId = info.id;
                inputName.value = info.name;
                gender;
                hobbies;
            });
    }
    deleteAllUser() {
        const data = this.getAllData();
        if (data.length > 0) {
            this.deleteAllData();
            this.userMap.forEach(data => data.remove());
            this.userMap.clear();
        }
        else {
            console.log("data masih kosong");
        }
    }
    showForm() {
        const dataForm = document.getElementById("dataForm");
        dataForm.style.display = "block";
    }
    hideForm() {
        const dataForm = document.getElementById("dataForm");
        dataForm.style.display = "none";
    }
    showSearchFilter() {
        const searchForm = document.getElementById("searchForm");
        searchForm.style.display = "block";
    }
    hideSearchFilter() {
        const searchForm = document.getElementById("searchForm");
        searchForm.style.display = "none";
    }
}
class ThemeChanger {
    constructor(themeKey, attribute) {
        this.key = themeKey;
        this.attrTheme = attribute;
        this.currentState = localStorage.getItem(this.key) || 'inactive';
        this.applyTheme();
    }
    applyTheme() {
        localStorage.setItem(this.key, this.currentState);
        document.body.setAttribute(this.attrTheme, this.currentState);
    }
    changeTheme() { }
}
document.addEventListener("DOMContentLoaded", (event) => {
    event.preventDefault();
    const userManagement = new UserManagement();
    const dataForm = document.getElementById("dataForm");
    const searchForm = document.getElementById("searchForm");
    const searchMode = document.getElementById("searchMode");
    const addDataMode = document.getElementById("addDataMode");
    const closeForm = document.getElementById("closeForm");
    const closeFilter = document.getElementById("closeFilter");
    userManagement.showAllData();
    if (searchMode)
        searchMode.addEventListener("click", () => userManagement.showSearchFilter());
    if (addDataMode)
        addDataMode.addEventListener("click", () => userManagement.showForm());
    if (closeForm)
        closeForm.addEventListener("click", () => userManagement.hideForm());
    if (closeFilter)
        closeFilter.addEventListener("click", () => userManagement.hideSearchFilter());
    dataForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (userManagement.selectedId) {
        }
        else {
            const newUser = {
                id: Date.now(),
                name: inputName.value,
                gender: selectedGender,
                hobbies: selectedHobbies
            };
            userManagement.add(newUser);
            userManagement.showUserData(newUser);
        }
    });
});
