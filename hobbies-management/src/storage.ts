import db from "./config/firebase-config";
import { collection, addDoc, doc, deleteDoc, getDocs, updateDoc, onSnapshot } from "firebase/firestore";
import type { DocumentData, QuerySnapshot, Unsubscribe } from "firebase/firestore";

class DataStorage<A extends { id: string }> {
    private collectionName: string;

    constructor(collectionName: string) {
        this.collectionName = collectionName;
    }

    protected realtimeInit(callback: (data: A[]) => void): Unsubscribe {
        const unsubscribe = onSnapshot(collection(db, this.collectionName), (snapshot) => {
            const data = this.processSnapshot(snapshot);
            callback(data);
        });
        return unsubscribe;
    }

    protected processSnapshot(snapshot: QuerySnapshot<DocumentData>): A[] {
        return snapshot.docs.map(snp => ({ id: snp.id, ...snp.data() } as A));
    }

    protected async addToStorage(newData: Omit<A, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, this.collectionName), newData)
        return docRef.id;
    }

    protected async changeData(id: string, detail: Partial<Omit<A, 'id'>>): Promise<void> {
        await updateDoc(doc(db, this.collectionName, id), detail);
    }

    protected async deleteData(id: string): Promise<void> {
        await deleteDoc(doc(db, this.collectionName, id));
    }

    protected async deleteAllData(): Promise<void> {
        const getAllData = await getDocs(collection(db, this.collectionName));
        const deleteAllData = getAllData.docs.map(data => deleteDoc(data.ref));
        await Promise.all(deleteAllData);
    }
}

export default DataStorage;