import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { DatabaseProps, DeleteDataProps, InsertDataProps, UpdateDataProps, UpsertDataProps } from "./custom-types";
import { supabase } from "./supabase-config";

export default function TableStorage<K extends { id: string }>() {
    let currentData: Map<string, K> = new Map<string, K>();
    let realtimeChannel: RealtimeChannel | null = null;
    let isInitialize: boolean = false;
    let additionalQueryFn: ((query: any) => any) | null = null;
    let relationalQuery: string | null = null;

    async function realtimeInit(props: DatabaseProps<K>): Promise<void> {
        if (realtimeChannel && isInitialize) {
            console.log(`Table for ${props.tableName} has been initialized`);
            props.callback([]);
            return;
        }

        if (realtimeChannel) {
            realtimeChannel.unsubscribe();
            realtimeChannel = null;
        }

        additionalQueryFn = props.additionalQuery || null;
        relationalQuery = props.relationalQuery || null;
        
        realtimeChannel = supabase.channel('any');
        realtimeChannel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: props.tableName },
            async (payload: RealtimePostgresChangesPayload<K>) => {
                switch(payload.eventType) {
                    case "INSERT": {
                        let query = supabase
                        .from(props.tableName)
                        .select(props.relationalQuery || '*')
                        .eq('id', payload.new.id)
                        .single();

                        const { data, error } = await query;
                        
                        if (error) throw error.message;

                        if (additionalQueryFn) query = additionalQueryFn(query);

                        const transformData = transformedData(data);
                        currentData.set(transformData.id, transformData);
                        break;
                    }
                    case "UPDATE": {
                        let query = supabase
                        .from(props.tableName)
                        .select(props.relationalQuery || '*')
                        .eq('id', payload.new.id)
                        .single();

                        const { data, error } = await query;
                        
                        if (error) throw error.message;

                        if (additionalQueryFn) query = additionalQueryFn(query);

                        const transformData = transformedData(data);
                        currentData.set(transformData.id, transformData);
                        break;
                    }
                    case "DELETE": {
                        const deletedId = payload.old.id;
                        if (deletedId) currentData.delete(deletedId);
                        break;
                    }
                }
                props.callback(toArray());
            }
        );

        let query = supabase
        .from(props.tableName)
        .select(props.relationalQuery || '*');

        if (additionalQueryFn) query = additionalQueryFn(query);
        
        const { data, error } = await query;

        if (error) {
            props.callback([]);
            throw error.message;
        }

        currentData.clear();

        data.forEach((dt) => {
            const transformData = transformedData(dt);
            currentData.set(transformData.id, transformData);
        });

        props.callback(toArray());
        isInitialize = true;
        realtimeChannel.subscribe();
    }

    function transformedData(data: any): K {
        if (data && data.created_at && typeof data.created_at === 'string') {
            return { ...data, created_at: new Date(data.created_at) } as K;
        }
        return data as K;
    }

    async function insertData(props: InsertDataProps<K>): Promise<string> {
        const { data, error } = await supabase
        .from(props.tableName)
        .insert([props.newData])
        .select();

        if (error) throw error.message;

        return data[0].id;
    }

    async function upsertData(props: UpsertDataProps<K>): Promise<any> {
        const { data, error } = await supabase
        .from(props.tableName)
        .upsert([props.upsertedData])
        .select()
        .single();

        if (error) throw error.message;

        return data
    }

    async function updateData(props: UpdateDataProps<K>): Promise<void> {
        const { error } = await supabase
        .from(props.tableName)
        .update(props.newData)
        .eq(props.column, props.column);

        if (error) throw error.message;
    }

    async function deleteData(props: DeleteDataProps): Promise<void> {
        if (props.column !== undefined) {
            if (typeof props.values === 'string') {                
                const { error } = await supabase
                .from(props.tableName)
                .delete()
                .eq(props.column, props.values);

                if (error) throw error.message;
            } else if (Array.isArray(props.values)) {
                const { error } = await supabase
                .from(props.tableName)
                .delete()
                .in(props.column, props.values);

                if (error) throw error.message;
            } else {
                const { error } = await supabase
                .from(props.tableName)
                .delete()
                .not(props.tableName, 'is', null);

                if (error) throw error.message;
            }
        }
    }

    function toArray(): K[] {
        return Array.from(currentData.values());
    }

    function teardownDatabase(): void {
        currentData.clear();
        isInitialize = false;

        if (realtimeChannel) {
            realtimeChannel.unsubscribe();
            realtimeChannel = null;
        }

        additionalQueryFn = null;
        relationalQuery = null;
    }

    return { 
        currentData, deleteData, insertData, realtimeInit, 
        teardownDatabase, toArray, updateData, upsertData
    }
}