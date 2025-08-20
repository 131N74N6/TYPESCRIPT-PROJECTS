import { CountryList } from "./components";
import type { Countries } from "./custom-types";

const countryList = document.getElementById('country-list') as HTMLElement;
const name = ''

async function fetchCountryData(url: string): Promise<void> {
    try {
        const request = await fetch(url);
        if (request.ok) {
            const response = await request.json();
            const countryFragment = document.createDocumentFragment();
            response.data.forEach((country: Countries) => countryFragment.appendChild(CountryList(country)));
            console.log(response);
            countryList.appendChild(countryFragment);
        } else {
            throw 'Check your network';
        }
    } catch (error: any) {
        console.log(error.message || error);
    }
}

function init(): void {
    const api = `https://restcountries.com/v3.1/name/${name}`;
    fetchCountryData(api);
}

document.addEventListener('DOMContentLoaded', init);