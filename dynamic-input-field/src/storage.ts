import db from "./config/firebase-config";
import { addDoc, collection, doc, deleteDoc, getDocs, updateDoc } from "firebase/firestore";

class DataManager <I extends { id: string }>{
    private collection_name;

    constructor(collection_name: string) {
        this.collection_name = collection_name;
    }

    protected async loadFromStorage(): Promise<I[]> {
        const snapshots = await getDocs(collection(db, this.collection_name));
        return snapshots.docs.map(dt => { return { id: dt.id, ...dt.data() } as I });
    }

    protected async addToStorage(new_data: Omit<I, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, this.collection_name), new_data);
        return docRef.id;
    }

    protected async changeSelectedData(id: string, updated_data: Partial<Omit<I, 'id'>>): Promise<void> {
        await updateDoc(doc(db, this.collection_name, id), updated_data);
    }

    protected async deleteSelectedData(id: string): Promise<void> {
        await deleteDoc(doc(db, this.collection_name, id));
    }

    protected async deleteAllData(): Promise<void> {
        const getAllData = await getDocs(collection(db, this.collection_name));
        const deleteAll = getAllData.docs.map(dt => deleteDoc(dt.ref));
        await Promise.all(deleteAll);
    }
}

export default DataManager;