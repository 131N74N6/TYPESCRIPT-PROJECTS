import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, updateDoc } from "firebase/firestore";
import type { DocumentData, QuerySnapshot, Unsubscribe } from "firebase/firestore";
import db from "./firebase-config";

const Storage = <HX extends { id: string }>(collection_name: string) => ({
    realtimeInit(callback: (data: HX[]) => void): Unsubscribe {
        const unsubscribe = onSnapshot(collection(db, collection_name), (snapshot) => {
            const data = this.processSnapshot(snapshot);
            callback(data);
        });
        return unsubscribe;
    },

    processSnapshot(snapshot: QuerySnapshot<DocumentData>): HX[] {
        return snapshot.docs.map((snpt) => ({ id: snpt.id, ...snpt.data() } as HX));
    },

    async saveToStorage(newData: Omit<HX, 'id'>): Promise<void> {
        await addDoc(collection(db, collection_name), newData);
    },

    async changeData(id: string, newData: Partial<Omit<HX, 'id'>>): Promise<void> {
        await updateDoc(doc(db, collection_name, id), newData);
    },

    realtimeGetSelectedData(id: string, callback: (data: HX | null) => void): Unsubscribe {
        const unsubscribe = onSnapshot(doc(db, collection_name, id), (snapshot) => {
            const data = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as HX : null;
            callback(data);
        });
        return unsubscribe;
    },

    async deleteSelectedData(id: string): Promise<void> {
        await deleteDoc(doc(db, collection_name, id));
    },

    async deleteAllData(): Promise<void> {
        const data = await getDocs(collection(db, collection_name));
        const process = data.docs.map((dt) => deleteDoc(dt.ref));
        await Promise.all(process);
    }
});

export default Storage;