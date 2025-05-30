import db from "./config/firebase-config";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, Timestamp, updateDoc } from "firebase/firestore";
import type { DocumentData, QuerySnapshot, Unsubscribe } from "firebase/firestore";

const StorageManager = <X extends { id: string }>(collectionName: string) => ({
    realtimeinit(callback: (data: X[]) => void): Unsubscribe {
        const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
            const data = this.processSnapshot(snapshot);
            callback(data);
        });

        return unsubscribe
    },

    processSnapshot(snapshot: QuerySnapshot<DocumentData>): X[] {
        return snapshot.docs.map((dt) => {
            const convertedData = this.convertTimestamps(dt.data());
            return { id: dt.id, ...convertedData } as X;
        });
    },

    async loadFromStorage(): Promise<X[]> {
        const snapshot = await getDocs(collection(db, collectionName));
        return this.processSnapshot(snapshot);
    },

    async addToStorage(newData: Omit<X, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, collectionName), newData);
        return docRef.id;
    },

    async changeSelectedData(id: string, newData: Partial<Omit<X, 'id'>>): Promise<void> {
        const convertedData = this.convertTimestamps(newData); 
        await updateDoc(doc(db, collectionName, id), convertedData);
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