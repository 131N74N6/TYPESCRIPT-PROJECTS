import './style.css';

let urlLink;

async function blackenedWaifu(): Promise<void> {
    const request = await fetch(`https://api.ferdev.my.id/maker/tohitam?link=${urlLink}`);
    const response = await request.json();
    console.log(response);
}

await blackenedWaifu();