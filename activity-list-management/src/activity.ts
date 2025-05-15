import StorageManager from "./storage";

type Activity = {
    id: string;
    activity: string;
    createdAt: string;
}

const dataStorage = StorageManager<Activity>("activity list");

function ActivityManagement(): void {({
    getAllData: dataStorage.loadFromStorage() as Activity[],
})}

export default ActivityManagement;