import './style.css';
import ActivityManagement from './activity';

const app = document.getElementById("app") as HTMLDivElement;

const notification = document.createElement("section") as HTMLElement;
notification.id = "notification";

const activityList = document.createElement("section") as HTMLElement;
activityList.id = "activity-list";

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

app.append(notification, activityList, activityForm);

/*
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css"/>
    <title>TODO-List</title>
</head>
<body>
    <main>
        <!-- Notifikasi -->
        <section id="notification"></section>
    
        <!-- daftar aktivitas -->
        <section id="activity-list"></section>
    
        <!-- input aktivitas -->
         <section id="activity-field">
            <form title="todo-form" id="activity-form">
                <textarea id="todo-name" placeholder="masukkan list..."></textarea>
                <div id="button-wrap">
                    <button type="submit" id="submit-btn">Add Activity</button>
                    <button type="button" id="delete-all">Delete All</button>
                    <button type="button" id="reset-form">Clear</button>
                </div>
            </form>
        </section>
    </main>
    <script src="./dist/main.js"></script>
</body>
</html>
*/

const activitManagement = await ActivityManagement(notification, activityForm, activityList, activityName, submitButton);

async function init(): Promise<void> {
    activitManagement.showAllActivities();
    activitManagement.eventListeners();
}

async function teardown(): Promise<void> {
    activitManagement.controller.abort();
    activitManagement.teardownModal();
    activitManagement.resetActivityForm();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);