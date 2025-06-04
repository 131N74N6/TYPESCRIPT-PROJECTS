import DatabaseStorage from "./storage";

interface ImageForm {
    id: string;
    created_at: Date;
    title: string;
    image_name: string[];
    image_url: string[];
}

class ImageForm extends DatabaseStorage<ImageForm> {
    constructor() {
        super("image_gallery");
    }

    initEventListener(): void {}

    showAllImages(): void {}
}

const imageForm = new ImageForm();

function initForm(): void {
    imageForm.initEventListener();
}

function teardownForm(): void {
    imageForm.teardownStorage();
}

document.addEventListener("DOMContentLoaded", initForm);
window.addEventListener("beforeunload", teardownForm);