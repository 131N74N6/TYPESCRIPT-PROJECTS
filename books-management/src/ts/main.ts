class MainPage {}

const mainPage = new MainPage();

function init(): void {
    mainPage;
}

function cleanup(): void {
    // test
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", cleanup);