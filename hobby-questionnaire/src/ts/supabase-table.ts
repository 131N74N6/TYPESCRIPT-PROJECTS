import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import supabase from "./supabase-config";

function TableStorage<P extends { id: string }>(table_name: string) {
    let currentData: Map<string, P> = new Map<string, P>();
    let realtimeChannel: RealtimeChannel | null = null;
    let isInitialize: boolean = false;

    async function realtimeInit(callback: (data: P[]) => void): Promise<void> {
        if (realtimeChannel && isInitialize) {
            console.warn(`Storage for ${table_name} has been initialized`);
            callback(toArray());
            return;
        }

        if (realtimeChannel) {
            realtimeChannel.unsubscribe();
            realtimeChannel = null;
        }

        realtimeChannel = supabase.channel('any')
        realtimeChannel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: table_name },
            (payload: RealtimePostgresChangesPayload<P>) => {
                switch(payload.eventType) {
                    case "INSERT": {
                        const newData = processData(payload.new);
                        currentData.set(newData.id, newData);
                        break;
                    }
                    case "UPDATE": {
                        const changeData = processData(payload.new);
                        currentData.set(changeData.id, changeData);
                        break;
                    }
                    case "DELETE": {
                        const data = payload.old.id;
                        if (data) currentData.delete(data);
                        break;
                    }
                }
            }
        );

        const { data, error } = await supabase
        .from(table_name)
        .select('*');

        if (error) throw error;

        currentData.clear();
        data.forEach(data => {
            const processed = processData(data);
            currentData.set(processed.id, processed);
        });

        callback(toArray());
        isInitialize = true;
        realtimeChannel.subscribe();
    }

    function processData(data: any): P {
        if (data && data.created_at && typeof data.created_at === 'string') {
            return { ...data, created_at: new Date(data.created_at) } as P
        }
        return data as P;
    }

    async function insertData(newData: Omit<P, 'id'>): Promise<string> {
        const { data, error } = await supabase
        .from(table_name)
        .insert([newData])
        .select()

        if (error) throw error;
        return data[0].id;
    }

    async function changeData(id: string, newData: Partial<Omit<P, 'id'>>): Promise<void> {
        const { error } = await supabase
        .from(table_name)
        .update(newData)
        .eq('id', id)

        if (error) throw error;
    }

    function toArray(): P[] {
        return Array.from(currentData.values());
    }

    async function deleteData(id: string): Promise<void>
    async function deleteData(id?: string): Promise<void>

    async function deleteData(id?: string): Promise<void> {
        if (id !== undefined) {
            const { error } = await supabase
            .from(table_name)
            .delete()
            .eq('id', id)

            if (error) throw error;
        } else {
            const { error } = await supabase
            .from(table_name)
            .delete()
            .not('id', 'is', null)

            if (error) throw error;
        }
    }

    return { changeData, currentData, deleteData, insertData, realtimeInit }
}

export default TableStorage;