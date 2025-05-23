import './style.css';

let urlLink;

async function blackenedWaifu(): Promise<void> {
    const request = await fetch(`https://api.ferdev.my.id/maker/tohitam?link=${urlLink}`);
    const response = await request.json();
    console.log(response);
}

changeFileToUrl(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null; 
    this.currentFile = file;

    if (file) {
        const reader = new FileReader();
        reader.onloadend = (event) => {
            this.currentFileDataUrl = event.target?.result as string;
            if (file.type.startsWith('image/')) {
                preview.innerHTML = `<img src="${this.currentFileDataUrl}" alt="Preview">`;
            } else {
                preview.textContent = file.name;
            }
        }
        reader.readAsDataURL(file);
    }
},

await blackenedWaifu();