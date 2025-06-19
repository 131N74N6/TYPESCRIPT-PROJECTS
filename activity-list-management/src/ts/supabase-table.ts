import supabase from "./supabase-config";
import { RealtimeChannel, type RealtimePostgresChangesPayload } from "@supabase/supabase-js";

function TableStorage<SS extends { id: string }>(tableName: string) {
    let currentData: Map<string, SS> = new Map<string, SS>();
    let isInitialized: boolean = false;
    let realtimeChannel: RealtimeChannel | null = null;

    async function realtimeInit(callback: (data: SS[]) => void): Promise<void> {
        if (isInitialized && realtimeChannel) {
            console.warn(`Storage for ${tableName} has been initialized`);
            callback(toArray());
            return;
        }

        if (realtimeChannel) {
            realtimeChannel.unsubscribe();
            realtimeChannel = null;
        }

        realtimeChannel = supabase.channel('any');
        realtimeChannel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: tableName },
            (payload: RealtimePostgresChangesPayload<SS>) => {
                const processItem = (item: any): SS => {
                    if (item && item.created_at && typeof item.created_at === 'string') {
                        return { ...item, created_at: new Date(item.created_at) } as SS;
                    } 
                    return item as SS;
                }

                switch (payload.eventType) {
                    case 'INSERT': {
                        const newItem = processItem(payload.new);
                        currentData.set(newItem.id, newItem);
                        break;
                    }
                    case 'UPDATE': {
                        const updatedItem = processItem(payload.new);
                        currentData.set(updatedItem.id, updatedItem);
                        break;
                    }
                    case 'DELETE': {
                        const deletedId = payload.old.id;
                        if (deletedId) currentData.delete(deletedId);
                        break;
                    }
                }
                callback(toArray());
            }
        );
        
        const { data, error } = await supabase
        .from(tableName)
        .select('*');

        if (error) {
            console.error('Initial data fetch error:', error);
            callback([]);
            return;
        }

        currentData.clear();
        data.forEach(dt => {
            const processed = { ...dt, created_at: new Date(dt.created_at) } as SS;
            currentData.set(processed.id, processed);
        });

        callback(toArray());
        realtimeChannel.subscribe();
        isInitialized = true;
    }

    async function insert(newData: Omit<SS, 'id'>): Promise<string> {
        const { data: inserted, error } = await supabase
        .from(tableName)
        .insert([newData])
        .select();

        if (error) throw error
        return inserted[0].id;
    }

    async function selectData(id: string): Promise<SS> {
        const { data, error } = await supabase
        .from(tableName)
        .select("*") 
        .eq('id', id);

        if (error) throw new Error(`Failed to show selected data: ${error}`);

        const item = data[0];
        return { ...item, created_at: new Date(item.created_at) } as SS;
    }

    async function changeSelectedData(id: string, newData: Partial<Omit<SS, 'id'>>): Promise<void> {
        const { error } = await supabase
        .from(tableName)
        .update(newData)
        .eq('id', id);

        if (error) throw error
    }

    async function deleteSelectedData(id: string): Promise<void> {
        const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

        if (error) throw error
    }

    async function deleteAllData(): Promise<void> {
        const { error } = await supabase
        .from(tableName)
        .delete()
        .not('id', 'is', null); // Delete all records

        if (error) throw error
    }

    function teardownStorage(): void {
        currentData.clear();
        isInitialized = false;
        if (realtimeChannel) {
            realtimeChannel.unsubscribe();
            realtimeChannel = null;
        }
    }

    function toArray(): SS[] {
        return Array.from(currentData.values());
    }

    return { 
        changeSelectedData, 
        currentData, 
        deleteSelectedData, 
        deleteAllData, 
        insert, 
        realtimeInit, 
        selectData,
        teardownStorage,
        toArray
    }
}

export default TableStorage;