import Storage from "./storage";

const roomTempHumid = document.getElementById("room-temp-humid") as HTMLElement;
const controller = new AbortController();

interface DHT11 {
    id: string;
    temperature: number;
    humidity: number;
}

class Displayer extends Storage<DHT11>{
    constructor() {
        super("dht11_sensor_data");
    }

    initEventListener(): void {
        this.realtimeInit(() => this.showAllDHT11Data());

        document.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#delete-all")) await this.deleteAllDHT11Data();
        }, { signal: controller.signal });
    }

    showAllDHT11Data(): void {
        try{
            const dht11Fragment = document.createDocumentFragment();
            if (this.currentData.length > 0) {
                roomTempHumid.innerHTML = '';
                this.currentData.forEach(act => dht11Fragment.appendChild(
                    this.createActivityComponent(act)
                ));
                roomTempHumid.appendChild(dht11Fragment);
            } else {
                roomTempHumid.innerHTML = '';
                roomTempHumid.textContent = "...No Data..";
            }
        } catch(error) {
           console.log(`Failed to show data: ${error}`);
        }
    }

    private createActivityComponent(detail: DHT11): HTMLDivElement {
        const activityComponent = document.createElement("div") as HTMLDivElement;
        activityComponent.className = "detail-data";

        const humidity = document.createElement("div") as HTMLDivElement;
        humidity.className = "humidity";
        humidity.textContent = `Humidity: ${detail.humidity}%`;
        humidity.style.fontWeight = "500";

        const temperature = document.createElement("div") as HTMLDivElement;
        temperature.className = "temperature";
        temperature.textContent = `Temperature: ${detail.temperature}℃`;

        const buttonWrap = document.createElement("div") as HTMLDivElement;
        buttonWrap.className = "button-wrap";

        const selectBtn = document.createElement("button") as HTMLButtonElement;
        selectBtn.type = "button";
        selectBtn.textContent = "Select";
        selectBtn.className = "select-button";

        const deleteBtn = document.createElement("button") as HTMLButtonElement;
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-button";

        buttonWrap.append(selectBtn, deleteBtn);
        activityComponent.append(humidity, temperature, buttonWrap);

        return activityComponent;
    }

    async deleteAllDHT11Data(): Promise<void> {
        try {
            await this.deleteAllData();
        } catch (error) {
            console.error(error);
        }
    }

    teardown(): void {
        this.currentData = [];
        controller.abort();
    }
}

const showData = new Displayer();

function init(): void {
    showData.initEventListener();
}

function teardown(): void {
    showData.teardown();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);