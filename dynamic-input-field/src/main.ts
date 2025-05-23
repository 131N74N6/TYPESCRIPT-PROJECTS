import DisplayManager from './handler';
import ErrorMessage from './components/error-message';
import Modal from './components/modal';

const inputSection = document.getElementById("inputSection") as HTMLFormElement;
const nameInput = document.getElementById('nameInput') as HTMLInputElement;
const dynamicFields = document.getElementById("dynamicFields") as HTMLDivElement;

const searchSection = document.getElementById("searchSection") as HTMLFormElement;
const searchData = document.getElementById("searchData") as HTMLInputElement;
const mainController = new AbortController();

const itemsList = document.getElementById("itemsList") as HTMLElement;
const modalMessage = document.getElementById("modal-msg") as HTMLElement;
const errorNotification = document.getElementById("error-notification") as HTMLElement

const displayer = new DisplayManager(
    inputSection, nameInput, dynamicFields, searchSection, searchData, itemsList, modalMessage, 
    errorNotification
);

const connectionLost = new ErrorMessage(errorNotification);

const modal = new Modal(modalMessage);

function init(): void {
    window.addEventListener("offline", () => {
        connectionLost.createAndshowError("Connection lost 🛜!. Check your internet connection.")
    }, { signal: mainController.signal });

    window.addEventListener("online", () => {
        modal.createModalComponent("Connected!");
    }, { signal: mainController.signal });

    displayer.showAllData();
}

function teardown(): void {
    displayer.cleanUp();
    mainController.abort();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);