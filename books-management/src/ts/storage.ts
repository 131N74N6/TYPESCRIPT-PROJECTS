import db from "./firebase-config";
import { 
    addDoc, collection, doc, getDocs, deleteDoc, onSnapshot, QuerySnapshot, Timestamp, updateDoc 
} from "firebase/firestore";
import type { DocumentData, Unsubscribe } from "firebase/firestore";

class DataStorage<S extends { id: string }> {
    private collection_name: string;

    constructor(collection_name: string) {
        this.collection_name = collection_name;
    }

    realtimeInit(callback: (data: S[]) => void): Unsubscribe {
        const unsubscribe = onSnapshot(collection(db, this.collection_name), (snapshot) => {
            const data = this.processSnapshot(snapshot);
            callback(data);
        });

        return unsubscribe;
    }
    
    protected processSnapshot(snapshot: QuerySnapshot<DocumentData>): S[] {
        return snapshot.docs.map(d => {
            const convertedData = this.convertTimestamps(d.data());
            return { id: d.id, ...convertedData } as S;
        });
    }

    protected async saveToStorage(new_data: Omit<S, 'id'>): Promise<void> {
        await addDoc(collection(db, this.collection_name), new_data);
    }

    protected async saveChanges(id: string, new_data: Partial<Omit<S, 'id'>>): Promise<void> {
        await updateDoc(doc(db, this.collection_name, id), new_data);
    }

    protected async deleteSelected(id: string): Promise<void> {
        await deleteDoc(doc(db, this.collection_name, id));
    }

    protected async deleteAllData(): Promise<void> {
        const data = await getDocs(collection(db, this.collection_name));
        const deleted = data.docs.map(dt => deleteDoc(dt.ref));
        await Promise.all(deleted);
    }

    private convertTimestamps(data: DocumentData) {
        return Object.entries(data).reduce((acc, [key, value]) => {
            if (value instanceof Timestamp) {
                acc[key] = value.toDate();
            } else {
                acc[key] = value;
            } return acc;
        }, {} as Record<string, any>);
    }
}

export default DataStorage;