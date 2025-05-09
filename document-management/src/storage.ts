import db from "./firebase-config.js";
import { 
    collection, addDoc, getDocs, updateDoc, 
    deleteDoc, doc, onSnapshot, Firestore 
} from 'firebase/firestore';

const DataStorages = <N extends { id: string }>(collectionName: string) => ({
    async addToStorage(newItem: Omit<N, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db as Firestore, collectionName), newItem);
        return docRef.id;
    },

    async loadFromStorage(): Promise<N[]> {
        const snapshot = await getDocs(collection(db as Firestore, collectionName));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as N);
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

    subscribe(callback: (data: N[]) => void) {
        return onSnapshot(collection(db as Firestore, collectionName), (snapshot) => {
            callback(snapshot.docs.map(dt => ({ id: dt.id, ...dt.data() }) as N));
        });
    }
});

export default DataStorages;