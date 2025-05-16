import db from "./config/firebase-config";
import { addDoc, collection, deleteDoc, doc, getDocs, Timestamp, updateDoc } from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";

const StorageManager = <X extends { id: string }>(collectionName: string) => ({
    async loadFromStorage(): Promise<X[]> {
        const snapshot = await getDocs(collection(db, collectionName));
        return snapshot.docs.map(d => {
            const convertedData = this.convertTimestamps(d.data());
            return { id: d.id, ...convertedData } as X;
        });
    },

    async addToStorage(newData: Omit<X, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, collectionName), newData);
        return docRef.id;
    },

    async changeSelectedData(id: string, newData: Partial<Omit<X, 'id'>>): Promise<void> {
        await updateDoc(doc(db, collectionName, id), newData);
    },

    async deleteSelectedData(id: string): Promise<void> {
        await deleteDoc(doc(db, collectionName, id));
    },

    async deleteAllData(): Promise<void> {
        const snapshot = await getDocs(collection(db, collectionName));
        const deleteAll = snapshot.docs.map(dt => deleteDoc(dt.ref));
        await Promise.all(deleteAll);
    }, 

    convertTimestamps(data: DocumentData) {
        return Object.entries(data).reduce((acc, [key, value]) => {
            if (value instanceof Timestamp) {
                acc[key] = value.toDate();
            } else {
                acc[key] = value;
            } return acc;
        }, {} as Record<string, any>);
    }
});

export default StorageManager;