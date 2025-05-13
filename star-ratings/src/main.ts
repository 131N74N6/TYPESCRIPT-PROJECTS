import UserRating from './rating.js';
import './style.css';

const app = document.getElementById("app") as HTMLDivElement;
let user: UserRating;

const sidebar = document.createElement("header") as HTMLElement;
sidebar.className = "sidebar";

const deleteAllRatings = document.createElement("button") as HTMLButtonElement;
deleteAllRatings.type = "button";
deleteAllRatings.id = "delete-all-ratings";
deleteAllRatings.textContent = "Delete All";

sidebar.append(deleteAllRatings);

const ratingStars = document.createElement("main") as HTMLElement;
ratingStars.className = "rating-stars";

const ratingsList = document.createElement("section") as HTMLElement;
ratingsList.id = "ratings-list";

const notification = document.createElement("section") as HTMLElement;
notification.id = "notification";

const starWidgets = document.createElement("form") as HTMLFormElement;
starWidgets.id = "star-widgets";
starWidgets.title = "rating-fields";

const stars = document.createElement("section") as HTMLElement;
stars.className = "stars";

const rating5 = document.createElement("input") as HTMLInputElement;
rating5.type = "radio";
rating5.name = "rate";
rating5.title = "rating-radio";
rating5.id = "rate-5";
rating5.value = "5";

const rating4 = document.createElement("input") as HTMLInputElement;
rating4.type = "radio";
rating4.name = "rate";
rating4.title = "rating-radio";
rating4.id = "rate-4";
rating4.value = "4";

const rating3 = document.createElement("input") as HTMLInputElement;
rating3.type = "radio";
rating3.name = "rate";
rating3.title = "rating-radio";
rating3.id = "rate-3";
rating3.value = "3";

const rating2 = document.createElement("input") as HTMLInputElement;
rating2.type = "radio";
rating2.name = "rate";
rating2.title = "rating-radio";
rating2.id = "rate-2";
rating2.value = "2";

const rating1 = document.createElement("input") as HTMLInputElement;
rating1.type = "radio";
rating1.name = "rate";
rating1.title = "rating-radio";
rating1.id = "rate-1";
rating1.value = "1";

const starIcon5 = document.createElement("i") as HTMLElement;
starIcon5.className = "fa-solid fa-star";

const label5 = document.createElement("label") as HTMLLabelElement;
label5.htmlFor = "rate-5";
label5.appendChild(starIcon5);

const starIcon4 = document.createElement("i") as HTMLElement;
starIcon4.className = "fa-solid fa-star";

const label4 = document.createElement("label") as HTMLLabelElement;
label4.htmlFor = "rate-4";
label4.appendChild(starIcon4);

const starIcon3 = document.createElement("i") as HTMLElement;
starIcon3.className = "fa-solid fa-star";

const label3 = document.createElement("label") as HTMLLabelElement;
label3.htmlFor = "rate-3";
label3.appendChild(starIcon3);

const starIcon2 = document.createElement("i") as HTMLElement;
starIcon2.className = "fa-solid fa-star";

const label2 = document.createElement("label") as HTMLLabelElement;
label2.htmlFor = "rate-2";
label2.appendChild(starIcon2);

const starIcon1 = document.createElement("i") as HTMLElement;
starIcon1.className = "fa-solid fa-star";

const label1 = document.createElement("label") as HTMLLabelElement;
label1.htmlFor = "rate-1";
label1.appendChild(starIcon1);

stars.append(rating5, label5, rating4, label4, rating3, label3, rating2, label2, rating1, label1);

const writingSection = document.createElement("section") as HTMLElement;
writingSection.id = "writing";

const username = document.createElement("input") as HTMLInputElement;
username.type = "text";
username.placeholder = "insert-name...";
username.id = "username";

const userOpinion = document.createElement("textarea") as HTMLTextAreaElement;
userOpinion.id = "comment";
userOpinion.placeholder = "insert-your-opinion";

const buttonWrap = document.createElement("div") as HTMLDivElement;
buttonWrap.className = "button-wrap";

const submitButton = document.createElement("button") as HTMLButtonElement;
submitButton.type = "submit";
submitButton.id = "save-btn";
submitButton.textContent = "Send";

const clearFormButton = document.createElement("button") as HTMLButtonElement;
clearFormButton.type = "button";
clearFormButton.id = "clear-form";
clearFormButton.textContent = "Clear Form";

buttonWrap.append(submitButton, clearFormButton);

writingSection.append(username, userOpinion, buttonWrap);

starWidgets.append(stars, writingSection);

ratingStars.append(notification, ratingsList, starWidgets);

app.append(sidebar, ratingStars);

function init(): void {
    user = new UserRating(starWidgets, username, userOpinion, ratingsList, submitButton, notification);
    user.showAllRatings();
}

function teardown(): void {
    user.cleanUp();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);