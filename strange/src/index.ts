const inputFields = document.getElementById("input-fields") as HTMLFormElement;
const words = document.getElementById("words") as HTMLInputElement;
const result = document.getElementById("result") as HTMLElement;
const submitButton = document.getElementById("submit-button") as HTMLButtonElement;
const resetButton = document.getElementById("reset-button") as HTMLButtonElement;
let controller: AbortController = new AbortController();

function setUpListeners(): void {
    inputFields.addEventListener("submit", (event) => transformString(event), {
        signal: controller.signal
    });

    resetButton.addEventListener("click", resetResult, { signal: controller.signal });
}

function transformString(event: SubmitEvent): void {
    event.preventDefault();
    const getString = words.value.trim();
    
    getString.split("")
    .map(word => Number(word))
    .filter(number => !isNaN(number))
    .reduce((a, b) => a + b, 0)
    .toString().
    split("")
    .reverse()
    .join("");

    result.textContent = getString;
    inputFields.reset();
}

function resetResult(): void {
    result.textContent = "Kamu belum memasukkan kata apapun...";
    inputFields.reset();
}

function init(): void {
    resetResult();
    setUpListeners();
}

function teardown(): void {
    controller.abort();
    result.textContent = "Kamu belum memasukkan kata apapun...";
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);