import { PokemonCard, ErrorMessage } from "./components";
import type { Pokemon } from "./custom-types";

const pokemonList = document.getElementById("pokemon-list") as HTMLElement;
const errorNotification = document.getElementById("error-notification") as HTMLElement;
const prevBtn = document.getElementById("prev-btn") as HTMLButtonElement;
const nextBtn = document.getElementById("next-btn") as HTMLButtonElement;
const controller = new AbortController();

let nextUrl: string | null = null;
let prevUrl: string | null = null;

async function getPokemonData(url: string): Promise<void> {
    pokemonList.innerHTML = '';
    errorNotification.innerHTML = '';
    
    try {
        const request = await fetch(url);
        if (request.ok) {
            const response = await request.json();
            
            // Simpan URL untuk pagination
            nextUrl = response.next;
            prevUrl = response.previous;
            
            // Atur status tombol pagination
            prevBtn.disabled = !prevUrl;
            nextBtn.disabled = !nextUrl;
            
            response.results.forEach((pokemon: Pokemon) => {
                const card = PokemonCard(pokemon);
                pokemonList.appendChild(card);
            });
        } else {
            throw "Check your internet conntextion";
        }
    } catch (error: any) {
        errorNotification.appendChild(ErrorMessage(`Error: ${error.message || error}`));
        pokemonList.innerHTML = '';
        pokemonList.textContent = `${error.message || error}`;
        prevBtn.disabled = true;
        nextBtn.disabled = true;
    }
}

function init(): void {
    const initialUrl = "https://pokeapi.co/api/v2/pokemon/";
    getPokemonData(initialUrl);

    nextBtn.addEventListener("click", () => {
        if (nextUrl) {
            getPokemonData(nextUrl);
        }
    }, { signal: controller.signal });

    prevBtn.addEventListener("click", () => {
        if (prevUrl) {
            getPokemonData(prevUrl);
        }
    }, { signal: controller.signal });
}

const teradown = () => controller.abort();

document.addEventListener("DOMContentLoaded", init);
window.addEventListener('beforeunload', teradown);