import type { Pokemon } from "./custom-types";

export function PokemonCard(pokemon: Pokemon): HTMLDivElement {
    const card = document.createElement("div") as HTMLDivElement;
    card.className = "bg-white p-4 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fade-in flex flex-col items-center justify-center space-y-2";
    
    const pokemonName = document.createElement("h3") as HTMLHeadingElement;
    pokemonName.textContent = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
    pokemonName.className = "text-[#2D3748] font-bold text-lg text-center";

    const pokemonImageWrap = document.createElement("div") as HTMLDivElement;
    pokemonImageWrap.className = 'w-32 h-32 flex items-center justify-center';

    const url = pokemon.url.split("/").filter(part => part !== '');
    const id = url[url.length - 1];

    const pokemonImage = document.createElement("img") as HTMLImageElement;
    pokemonImage.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${id}.svg`;
    pokemonImage.className = 'w-full h-full object-contain transition-transform duration-300 hover:rotate-6';
    pokemonImage.alt = pokemon.name;

    pokemonImageWrap.appendChild(pokemonImage);

    card.append(pokemonImageWrap, pokemonName);
    return card;
}

export function ErrorMessage(message: string): HTMLDivElement {
    const errorCard = document.createElement("div") as HTMLDivElement;
    errorCard.className = "bg-red-500 text-white p-4 rounded-lg shadow-xl animate-bounce-in";

    const h3 = document.createElement("h3") as HTMLHeadingElement;
    h3.className = "text-center font-semibold";
    h3.textContent = message;

    errorCard.appendChild(h3);

    return errorCard;
}