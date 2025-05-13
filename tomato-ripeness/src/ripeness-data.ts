import { collection, getDocs, Firestore } from "firebase/firestore";
import db from "./config/firebase-config";

type RipenessDetail = {
    id: string;
    status: string;
    color: { red: number, green: number, blue: number };
    time: Date;
}

const RipeNessData = (trData: HTMLTableRowElement) => ({
    async loadFromStorage(): Promise<RipenessDetail[]> {
        const snapshot = await getDocs(collection(db as Firestore, "ripeness-data"));
        return snapshot.docs.map(dt => { return { id: dt.id, ...dt.data() } as RipenessDetail})
    },

    async showAllData() {
        const getData = await this.loadFromStorage();
        const dataFragment = document.createDocumentFragment();
        getData.forEach(data => dataFragment.appendChild(this.makeDataComponents(data)));
    },

    makeDataComponents(detail: RipenessDetail): HTMLTableRowElement {
        const tdResult = document.createElement("td") as HTMLTableCellElement;
        tdResult.className = "result-displayer";
        tdResult.textContent = detail.status;
        
        const tdColor = document.createElement("td") as HTMLTableCellElement;
        tdColor.className = "color-displayer";
        tdColor.textContent = `R: ${detail.color.red}\nG: ${detail.color.green}\nB: ${detail.color.blue}`;

        const tdTime = document.createElement("td") as HTMLTableCellElement;
        tdTime.className = "time-displayer";
        tdTime.textContent = detail.time.toISOString();

        trData.append(tdResult, tdColor, tdTime);

        return trData;
    }
});

export default RipeNessData;