import ActivityManagement from './activity';

const notification = document.getElementById("notification") as HTMLElement;
const activityForm = document.getElementById("activity-form") as HTMLFormElement;
const activityName = document.getElementById("activity-name") as HTMLTextAreaElement;
const activityList = document.getElementById("activity-list") as HTMLElement;
const submitButton = document.getElementById("submit-btn") as HTMLButtonElement;

const activitManagement = ActivityManagement(notification, activityForm, activityList, activityName, submitButton);

async function init(): Promise<void> {
    await activitManagement.initEventListeners();
}

function teardown(): void {
    activitManagement.controller.abort();
    activitManagement.teardownModal();
    activitManagement.resetActivityForm();
    activitManagement.cleanupStorage();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);