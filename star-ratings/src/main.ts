import UserRating from './ratings';

let user: UserRating;
const ratingsList = document.getElementById("ratings-list") as HTMLElement;
const notification = document.getElementById("notification") as HTMLElement;
const starWidgets = document.getElementById("star-widgets") as HTMLFormElement;
const username = document.getElementById("username") as HTMLInputElement;
const userOpinion = document.getElementById("comment") as HTMLTextAreaElement;
const submitButton = document.getElementById("save-btn") as HTMLButtonElement;

function init(): void {
    user = new UserRating(starWidgets, username, userOpinion, ratingsList, submitButton, notification);
    user.setupEventListeners();
}

function teardown(): void {
    user.cleanUp();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);