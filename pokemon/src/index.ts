const pokemonList = document.getElementById("pokemon-list") as HTMLElement;

const getPokemonData = async(): Promise<void> => {
    const request = await fetch(`https://pokeapi.co/api/v2/pokemon/`);
    try {
        if (request.ok) {
            const response = await request.json();
            console.log(response);
        } else {
            console.log("Periksa koneksi anda");
        }
    } catch (error) {
        console.log("Internal server error");
    }
}

const showCardComponents = (): void => {}

const createCardComponent = (id: number): void => {
    const card = document.createElement("div");
    card.className = "pokemon-card";
    card.setAttribute("pokemon-card", String(id));
    card.innerHTML = `
        <div>{}</div>
        <div>{}</div>
        <div>{}</div>
    `;
}

getPokemonData();