const displayCounter = document.getElementById('display-counter') as HTMLElement;
const startStopwatchButton = document.getElementById('start-stopwatch-button') as HTMLButtonElement;
const stopStopwatchButton = document.getElementById('stop-stopwatch-button') as HTMLButtonElement;
const resetStopwatchButton = document.getElementById('reset-stopwatch-button') as HTMLButtonElement;

let timer: number | null = null;
let startTime: number = 0;
let elapsedTime: number = 0;
let isRunning: boolean = false;

function initStopwatch() {
    startStopwatchButton.onclick = () => startStopwatch();
    stopStopwatchButton.onclick = () => stopStopwatch();
    resetStopwatchButton.onclick = () => resetStopwatch();
}

function startStopwatch(): void {
    if (!isRunning) {
        startTime = Date.now() - elapsedTime;
        timer = setInterval(updateDisplay, 10);
        isRunning = true;
    }
}

function updateDisplay(): void {
    const currentTime = Date.now();
    elapsedTime = currentTime - startTime;

    let hours: number | string = Math.floor(elapsedTime / (1000 * 60 * 60));
    let minutes: number | string = Math.floor(elapsedTime / (1000 * 60) % 60);
    let seconds: number | string = Math.floor(elapsedTime / 1000 % 60);
    let miliseconds: number | string = Math.floor(elapsedTime % 1000 / 10);

    hours = String(hours).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');
    seconds = String(seconds).padStart(2, '0');
    miliseconds = String(miliseconds).padStart(2, '0');

    displayCounter.textContent = `${hours}:${minutes}:${seconds}:${miliseconds}`;
}

function stopStopwatch(): void {
    if (isRunning) {
        if (timer) clearInterval(timer);
        elapsedTime = Date.now() - startTime;
        isRunning = false;
    }
}

function resetStopwatch(): void {
    if (timer) clearInterval(timer);
    startTime = 0;
    elapsedTime = 0;
    isRunning = false;
    displayCounter.textContent = '00:00:00:00';
}

document.addEventListener('DOMContentLoaded', initStopwatch);
window.addEventListener('beforeunload', resetStopwatch);