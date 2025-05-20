import './style.css';
import ActivityManagement from './activity.js';

const app = document.getElementById("app") as HTMLDivElement;

const notification = document.createElement("section") as HTMLElement;
notification.id = "notification";

const activityList = document.createElement("section") as HTMLElement;
activityList.id = "activity-list";

const formWrap = document.createElement("section") as HTMLElement;
formWrap.id = "form-wrap";

const activityForm = document.createElement("form") as HTMLFormElement;
activityForm.id = "activity-form";
activityForm.title = "activity-form";

const activityName = document.createElement("textarea") as HTMLTextAreaElement;
activityName.placeholder = "enter activity....";
activityName.id = "activity-name";

const buttonWrap = document.createElement("div") as HTMLDivElement;
buttonWrap.id = "button-wrap";

const submitButton = document.createElement("button") as HTMLButtonElement;
submitButton.id = "submit-btn";
submitButton.type = "submit";
submitButton.textContent = "Add Data";

const deleteAllButton = document.createElement("button") as HTMLButtonElement;
deleteAllButton.id = "delete-all-btn";
deleteAllButton.type = "button";
deleteAllButton.textContent = "Delete All";

const resetFormButton = document.createElement("button") as HTMLButtonElement;
resetFormButton.id = "reset-btn";
resetFormButton.type = "button";
resetFormButton.textContent = "Clear Forn";

buttonWrap.append(submitButton, deleteAllButton, resetFormButton);

activityForm.append(activityName, buttonWrap);

formWrap.append(activityForm);

app.append(notification, activityList, formWrap);

const activitManagement = ActivityManagement(notification, activityForm, activityList, activityName, submitButton);

function init(): void {
    activitManagement.showAllActivities();
    activitManagement.eventListeners();
}

function teardown(): void {
    activitManagement.controller.abort();
    activitManagement.teardownModal();
    activitManagement.resetActivityForm();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);