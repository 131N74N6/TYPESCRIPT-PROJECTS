import db from "./config/firebase-config.js";
import { addDoc, collection, doc, deleteDoc, Firestore, getDocs, updateDoc, onSnapshot, Timestamp } from "firebase/firestore";
import type { DocumentData, QuerySnapshot, Unsubscribe } from "firebase/firestore";

class DataManager <V extends { id: string }> {
    protected collectionName: string;

    protected constructor(collectionName: string) {
        this.collectionName = collectionName;
    }

    protected realtimeInit(callback: (data: V[]) => void): Unsubscribe {
        const getRealTime = onSnapshot(collection(db, this.collectionName), (snapshot) => {
            const data = this.processSnapshot(snapshot);
            callback(data)
        });
        return getRealTime;
    }

    processSnapshot(snapshot: QuerySnapshot<DocumentData>): V[] {
        return snapshot.docs.map(d => {
            const convertedData = this.convertTimestamps(d.data());
            return { id: d.id, ...convertedData } as V;
        });
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

    convertTimestamps(data: DocumentData) {
        return Object.entries(data).reduce((acc, [key, value]) => {
            if (value instanceof Timestamp) {
                acc[key] = value.toDate();
            } else {
                acc[key] = value;
            } return acc;
        }, {} as Record<string, any>);
    }
}

export default DataManager;