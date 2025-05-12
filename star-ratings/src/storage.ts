import db from "./config/firebase-config.js";
import { addDoc, collection, doc, deleteDoc, Firestore, getDocs, updateDoc } from "firebase/firestore";

class DataManager <V extends { id: string }> {
    protected collectionName: string;

    protected constructor(collectionName: string) {
        this.collectionName = collectionName;
    }

    protected async loadFromStorage(): Promise<V[]> {
        const snapshots = await getDocs(collection(db as Firestore, this.collectionName));
        return snapshots.docs.map(doc => { return { id: doc.id, ...doc.data() } as V });
    }

    protected async addToStorage(data: Omit<V, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db as Firestore, this.collectionName), data);
        return docRef.id;
    }

    protected async changeSelectedData(id: string, data: Partial<Omit<V, 'id'>>): Promise<void> {
        await updateDoc(doc(db as Firestore, this.collectionName, id), data);
    }

    protected async deleteSelectedData(id: string): Promise<void> {
        await deleteDoc(doc(db as Firestore, this.collectionName, id));
    }

    protected async deleteAllData(): Promise<void> {
        const getAllData = await getDocs(collection(db as Firestore, this.collectionName));
        const deleteAllData = getAllData.docs.map(data => deleteDoc(data.ref));
        await Promise.all(deleteAllData);
    }
}

export default DataManager;