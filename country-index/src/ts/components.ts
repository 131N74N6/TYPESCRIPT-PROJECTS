import type { Countries } from "./custom-types";

export function CountryList(data: Countries): HTMLDivElement {
    const card = document.createElement('div') as HTMLDivElement;
    card.className = 'transform transition-all duration-300 hover:scale-105 bg-[#FFFFFF] p-[1rem]';
    const name = document.createElement('div') as HTMLDivElement;
    name.textContent = data.country;
    card.appendChild(name);
    return card;
}