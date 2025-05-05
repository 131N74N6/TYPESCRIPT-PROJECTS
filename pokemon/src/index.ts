type Pokemon = {
    name: string;
    url: string;
}

const pokemonList = document.getElementById("pokemon-list") as HTMLElement;
const errorNotification = document.getElementById("error-notification") as HTMLElement;

async function getPokemonData(): Promise<void> {
    const request = await fetch(`https://pokeapi.co/api/v2/pokemon/`);
    try {
        if (request.ok) {
            const response = await request.json();
            response.results.forEach((pokemon: Pokemon) => {
                const card = createCardComponent(pokemon);
                pokemonList.appendChild(card);
            });
            console.log(response);
        } else {
            errorNotification.appendChild(errorMessage("Periksa koneksi anda"));
        }
    } catch (error) {
        errorNotification.appendChild(errorMessage("Internal server error"));
    }
}

function createCardComponent(pokemon: Pokemon): HTMLDivElement {
    const card = document.createElement("div") as HTMLDivElement;
    card.className = "pokemon-card";
    
    const pokemonName = document.createElement("div") as HTMLDivElement;
    pokemonName.textContent = pokemon.name;
    pokemonName.className = "pokemon-name";

    const pokemonImageWrap = document.createElement("div") as HTMLDivElement;
    pokemonImageWrap.className = "image-wrap";

    const url = pokemon.url.split("/").filter(part => part !== '');
    const id = url[url.length - 1];

    const pokemonImage = document.createElement("img") as HTMLImageElement;
    pokemonImage.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${id}.svg`;
    pokemonImage.alt = pokemon.name;

    pokemonImageWrap.appendChild(pokemonImage);

    card.append(pokemonImageWrap, pokemonName);
    console.log(`${url}_${id}`);
    return card;
}

function errorMessage(message: string): HTMLDivElement {
    const errorCard = document.createElement("div") as HTMLDivElement;
    errorCard.className = "error-card";

    const h3 = document.createElement("h3") as HTMLHeadingElement;
    h3.className = "error-message";
    h3.textContent = message;

    errorCard.appendChild(h3);

    return errorCard;
}

function init(): void {
    getPokemonData();
}

document.addEventListener("DOMContentLoaded", init);