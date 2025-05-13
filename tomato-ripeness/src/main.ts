import RipeNessData from './ripeness-data.js';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app') as HTMLElement;
app.style.display = "flex";

const header = document.createElement("header") as HTMLElement;
header.className = "navbar";

const table = document.createElement("table") as HTMLTableElement;
table.className = "table";

const thHeader1 = document.createElement("th") as HTMLTableCellElement;
thHeader1.className = "data-title";
thHeader1.textContent = "No";

const thHeader2 = document.createElement("th") as HTMLTableCellElement;
thHeader2.className = "data-title";
thHeader2.textContent = "Status";

const thHeader3 = document.createElement("th") as HTMLTableCellElement;
thHeader3.className = "data-title";
thHeader3.textContent = "Warna";

const trHeader = document.createElement("tr") as HTMLTableRowElement;
trHeader.className = "title";
trHeader.append(thHeader1, thHeader2, thHeader3);

const trData = document.createElement("tr") as HTMLTableRowElement;
trData.className = "data-wrapper";

table.append(trHeader, trData);

app.append(header, table);

function init(): void {
    RipeNessData(trData);
}

document.addEventListener("DOMContentLoaded", init);