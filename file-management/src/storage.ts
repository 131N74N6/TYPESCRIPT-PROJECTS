import db from "./config/firebase-config.js";
import { 
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc, Timestamp, Firestore 
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";

const DataStorages = <N extends { id: string }>(collectionName: string) => ({
    async addToStorage(data: Omit<N, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db as Firestore, collectionName), data);
        return docRef.id;
    },

    async loadFromStorage(): Promise<N[]> {
        const snapshot = await getDocs(collection(db as Firestore, collectionName));
        return snapshot.docs.map(d => {
            const convertedData = this.convertTimestamps(d.data());
            return { id: d.id, ...convertedData } as N;
        });
    },

    async changeSelectedData(id: string, newData: Partial<Omit<N, 'id'>>): Promise<void> {
        await updateDoc(doc(db as Firestore, collectionName, id), newData);
    },

    async deleteSelectedData(id: string): Promise<void> {
        await deleteDoc(doc(db as Firestore, collectionName, id));
    },

    async deleteAllData(): Promise<void> {
        const querySnapshot = await getDocs(collection(db as Firestore, collectionName));
        const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
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

export default DataStorages;