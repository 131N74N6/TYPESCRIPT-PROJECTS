import db from "./config/firebase-config";
import { addDoc, collection, doc, deleteDoc, getDocs, onSnapshot, updateDoc } from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";

class DataManager <I extends { id: string }>{
    private collection_name;
    protected unsubscribe: Unsubscribe | null = null;

    constructor(collection_name: string) {
        this.collection_name = collection_name;
    }

    protected loadFromStorage(): Promise<I[]>;
    protected loadFromStorage(callback: (data: I[], error?: Error) => void): Unsubscribe;
    protected loadFromStorage(
        callback?: (data: I[], error?: Error) => void
    ): Promise<I[]> | Unsubscribe {
        const colRef = collection(db, this.collection_name);
        
        if (callback) {
            // Mode realtime listener
            this.unsubscribe = onSnapshot(
                colRef,
                (snapshot) => {
                    const data = snapshot.docs.map(dt => ({ 
                        id: dt.id, 
                        ...dt.data() 
                    }) as I);
                    callback(data, undefined);
                },
                (error) => callback([], error)
            );
            return this.unsubscribe;
        }
        
        // Mode single fetch
        return getDocs(colRef).then(snapshot => 
            snapshot.docs.map(dt => ({ 
                id: dt.id, 
                ...dt.data() 
            }) as I)
        );
    }

    protected async addToStorage(new_data: Omit<I, 'id'>): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, this.collection_name), new_data);
            return docRef.id;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error occurred";
            throw new Error(`Failed to add data: ${message}`);
        }
    }

    protected async changeSelectedData(id: string, updated_data: Partial<Omit<I, 'id'>>): Promise<void> {
        try {
            await updateDoc(doc(db, this.collection_name, id), updated_data);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error occurred";
            throw new Error(`Failed to update selected data: ${message}`);
        }
    }

    protected async deleteSelectedData(id: string): Promise<void> {
        try {
            await deleteDoc(doc(db, this.collection_name, id));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error occurred";
            throw new Error(`Failed to delete selected data: ${message}`);
        }
    }

    protected async deleteAllData(): Promise<void> {
        try {
            const getAllData = await getDocs(collection(db, this.collection_name));
            const deleteAll = getAllData.docs.map(dt => deleteDoc(dt.ref));
            await Promise.all(deleteAll);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error occurred";
            throw new Error(`Failed to delete all data: ${message}`);
        }
    }
}

export default DataManager;