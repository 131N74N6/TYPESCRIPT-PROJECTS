import UserManagement from './handler';
import './style.css';

const inputName = document.getElementById("name") as HTMLInputElement;
const searchInput = document.getElementById("searched-name") as HTMLInputElement;

const dataList = document.getElementById("data-list") as HTMLElement;
const dataForm = document.getElementById("dataForm") as HTMLFormElement;
const searchForm = document.getElementById("searchForm") as HTMLFormElement;

const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const toggleTheme = document.getElementById("dark-mode") as HTMLInputElement;

const notification = document.getElementById("notification") as HTMLElement;
const ascendSorting = document.getElementById("ascend-sorting") as HTMLInputElement;
const descendSorting = document.getElementById("descend-sorting") as HTMLInputElement;

const userManagement: UserManagement = new UserManagement(
    dataForm, inputName, dataList, searchForm, searchInput, submitBtn, toggleTheme, notification,
    ascendSorting, descendSorting
);

const init = (): void => {
    userManagement.setupGlobalListeners();
}

const cleanUp = (): void => {
    userManagement.cleanUp();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", cleanUp);