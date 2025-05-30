import db from "./firebase-config";
import { 
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, 
    QuerySnapshot, Timestamp 
} from "firebase/firestore";
import type { DocumentData, Unsubscribe } from "firebase/firestore";

const Storage = <Q extends { id: string }>(collectionName: string) => ({
    realtimeInit(callback: (data: Q[]) => void): Unsubscribe {
        const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
            const data = this.processSnapshot(snapshot);
            callback(data);
        });

        return unsubscribe;
    },

    processSnapshot(snapshot: QuerySnapshot<DocumentData>): Q[] {
        return snapshot.docs.map(d => {
            const convertedData = this.convertTimestamps(d.data());
            return { id: d.id, ...convertedData } as Q;
        });
    },

    async addToStorage(data: Omit<Q, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, collectionName), data);
        return docRef.id;
    },

    async changeSelectedData(id: string, newData: Partial<Omit<Q, 'id'>>): Promise<void> {
        await updateDoc(doc(db, collectionName, id), newData);
    },

    async deleteSelectedData(id: string): Promise<void> {
        await deleteDoc(doc(db, collectionName, id));
    },

    async deleteAllData(): Promise<void> {
        const querySnapshot = await getDocs(collection(db, collectionName));
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

export default Storage;