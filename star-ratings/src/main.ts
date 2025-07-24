import UserRating from './ratings';

const header = document.querySelector(".header") as HTMLElement;
const ascendSort = document.getElementById("ascend-sort") as HTMLInputElement;
const descendSort = document.getElementById("descend-sort") as HTMLInputElement;
const ratingFilter = document.querySelectorAll<HTMLInputElement>('.header input[type="checkbox"]');

const ratingsList = document.getElementById("ratings-list") as HTMLElement;
const notification = document.getElementById("notification") as HTMLElement;
const starWidgets = document.getElementById("star-widgets") as HTMLFormElement;
const username = document.getElementById("username") as HTMLInputElement;
const userOpinion = document.getElementById("comment") as HTMLTextAreaElement;
const submitButton = document.getElementById("save-btn") as HTMLButtonElement;

const user: UserRating = new UserRating({ 
    starWidgets: starWidgets, username: username, comment: userOpinion, ratingsList: ratingsList, 
    saveButton: submitButton, notification: notification, header: header, ascendSort: ascendSort, 
    descendSort: descendSort, ratingFilter: ratingFilter 
});

async function init(): Promise<void> {
    await user.setupEventListeners();
}

function teardown(): void {
    user.cleanUp();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);